/**
 * AgroFlow — OpenRosa Server v2 (Supabase Edge Function)
 * =====================================================
 * Implements the OpenRosa HTTP API protocol so that ODK Collect
 * can communicate DIRECTLY with Supabase — no ODK Central needed.
 *
 * ODK Collect Server URL (paste into the app):
 *   https://<your-project>.supabase.co/functions/v1/openrosa
 *
 * OpenRosa endpoints handled:
 *   GET  /formList          — returns XML list of available forms
 *   GET  /form-download     — serves the AgroFlow POD XForm XML
 *   HEAD /submission        — announces server capabilities
 *   POST /submission        — receives ODK multipart form submission
 *
 * The OpenRosa spec: https://docs.getodk.org/openrosa/
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ─── Embedded XForm (generated from AgroFlow_POD_XLSForm.xlsx) ────────────────
const XFORM_XML: string = "<?xml version=\"1.0\"?>\n<!--\n  AgroFlow \u2014 Proof of Delivery (POD) Form\n  Version : 2 (2025-04-01)\n  Changes from v1:\n    \u2022 Added vehicle / truck plate field (Section 1)\n    \u2022 Added season select field (Section 2)\n    \u2022 Added proc_code (procurement code) per item in repeat group\n    \u2022 Added qty_variance calculated field (auto = qty_received - qty_expected) per item\n    \u2022 Added signed_at field (Section 7 \u2014 location name where form is signed)\n    \u2022 Bumped form version + instanceName formula updated\n    \u2022 item_barcode constraint relaxed to allow INV-XXXXX format\n-->\n<h:html\n  xmlns=\"http://www.w3.org/2002/xforms\"\n  xmlns:h=\"http://www.w3.org/1999/xhtml\"\n  xmlns:ev=\"http://www.w3.org/2001/xml-events\"\n  xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"\n  xmlns:jr=\"http://openrosa.org/javarosa\"\n  xmlns:orx=\"http://openrosa.org/xforms\"\n  xmlns:odk=\"http://www.opendatakit.org/xforms\">\n\n  <h:head>\n    <h:title>AgroFlow \u2014 Proof of Delivery v2</h:title>\n    <model odk:xforms-version=\"1.0.0\">\n\n      <!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 ITEXT / LABELS \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n      <itext>\n        <translation lang=\"English\" default=\"true()\">\n\n          <!-- choice lists -->\n          <text id=\"device_type-0\"><value>Smartphone</value></text>\n          <text id=\"device_type-1\"><value>Tablet</value></text>\n          <text id=\"device_type-2\"><value>Dedicated handheld scanner</value></text>\n\n          <text id=\"season-0\"><value>2025 Long Rains</value></text>\n          <text id=\"season-1\"><value>2025 Short Rains</value></text>\n          <text id=\"season-2\"><value>2026 Long Rains</value></text>\n          <text id=\"season-3\"><value>2026 Short Rains</value></text>\n\n          <text id=\"district-0\"><value>Western Area</value></text>\n          <text id=\"district-1\"><value>Bo</value></text>\n          <text id=\"district-2\"><value>Bombali (Makeni)</value></text>\n          <text id=\"district-3\"><value>Kenema</value></text>\n          <text id=\"district-4\"><value>Kono</value></text>\n          <text id=\"district-5\"><value>Port Loko</value></text>\n          <text id=\"district-6\"><value>Tonkolili</value></text>\n          <text id=\"district-7\"><value>Kailahun</value></text>\n          <text id=\"district-8\"><value>Moyamba</value></text>\n          <text id=\"district-9\"><value>Bonthe</value></text>\n          <text id=\"district-10\"><value>Pujehun</value></text>\n          <text id=\"district-11\"><value>Kambia</value></text>\n          <text id=\"district-12\"><value>Koinadugu</value></text>\n\n          <text id=\"item_category-0\"><value>Seeds</value></text>\n          <text id=\"item_category-1\"><value>Fertilizer</value></text>\n          <text id=\"item_category-2\"><value>Pesticide</value></text>\n          <text id=\"item_category-3\"><value>Herbicide</value></text>\n          <text id=\"item_category-4\"><value>Tools / Equipment</value></text>\n          <text id=\"item_category-5\"><value>Other</value></text>\n\n          <text id=\"unit-0\"><value>Kilograms (Kg)</value></text>\n          <text id=\"unit-1\"><value>Bags (50kg)</value></text>\n          <text id=\"unit-2\"><value>Litres</value></text>\n          <text id=\"unit-3\"><value>Units (pieces)</value></text>\n          <text id=\"unit-4\"><value>Boxes</value></text>\n\n          <text id=\"item_condition-0\"><value>Good \u2014 intact, no damage</value></text>\n          <text id=\"item_condition-1\"><value>Minor \u2014 small marks or tears</value></text>\n          <text id=\"item_condition-2\"><value>Damaged \u2014 contents compromised</value></text>\n          <text id=\"item_condition-3\"><value>Rejected \u2014 refused by beneficiary</value></text>\n\n          <text id=\"overall_condition-0\"><value>Good \u2014 complete delivery</value></text>\n          <text id=\"overall_condition-1\"><value>Partial \u2014 some items short or damaged</value></text>\n          <text id=\"overall_condition-2\"><value>Damaged \u2014 significant issues</value></text>\n          <text id=\"overall_condition-3\"><value>Failed \u2014 delivery could not be made</value></text>\n\n          <text id=\"delivery_problem-0\"><value>No \u2014 delivery completed normally</value></text>\n          <text id=\"delivery_problem-1\"><value>Yes \u2014 a problem occurred</value></text>\n\n          <text id=\"confirmed-0\"><value>Yes \u2014 beneficiary confirmed verbally</value></text>\n          <text id=\"confirmed-1\"><value>No \u2014 beneficiary absent or refused</value></text>\n\n          <!-- section headers & field labels -->\n          <text id=\"/data/intro:label\"><value>\ud83c\udf3e AgroFlow \u2014 Proof of Delivery (POD) Form v2</value></text>\n          <text id=\"/data/intro:hint\"><value>Complete all starred (*) fields. Barcode fields open your camera scanner automatically.</value></text>\n\n          <text id=\"/data/sec_1:label\"><value>\u2500\u2500 SECTION 1 \u2014 FIELD OFFICER &amp; VEHICLE \u2500\u2500</value></text>\n          <text id=\"/data/officer_id:label\"><value>Officer ID *</value></text>\n          <text id=\"/data/officer_id:hint\"><value>Scan your ID badge or type your code (e.g. FO-001)</value></text>\n          <text id=\"/data/officer_name:label\"><value>Officer Full Name *</value></text>\n          <text id=\"/data/vehicle:label\"><value>Vehicle / Truck Plate *</value></text>\n          <text id=\"/data/vehicle:hint\"><value>Scan the truck barcode or type the plate (e.g. TRK-001)</value></text>\n          <text id=\"/data/device_type:label\"><value>Device Type</value></text>\n          <text id=\"/data/device_type:hint\"><value>How are you recording this?</value></text>\n          <text id=\"/data/gps_location:label\"><value>GPS Location *</value></text>\n          <text id=\"/data/gps_location:hint\"><value>Allow location access when prompted</value></text>\n          <text id=\"/data/delivery_datetime:label\"><value>Date &amp; Time of Delivery *</value></text>\n\n          <text id=\"/data/sec_2:label\"><value>\u2500\u2500 SECTION 2 \u2014 DISTRIBUTION LOOKUP &amp; SEASON \u2500\u2500</value></text>\n          <text id=\"/data/dist_ref:label\"><value>Scan Distribution Barcode *</value></text>\n          <text id=\"/data/dist_ref:hint\"><value>Scan the barcode on the load document (e.g. AG-2025-001847)</value></text>\n          <text id=\"/data/dist_ref_manual:label\"><value>Or Type Distribution Ref Manually</value></text>\n          <text id=\"/data/dist_ref_manual:hint\"><value>Type if camera scanner fails</value></text>\n          <text id=\"/data/season:label\"><value>Agricultural Season *</value></text>\n          <text id=\"/data/season:hint\"><value>Select the season this delivery belongs to</value></text>\n\n          <text id=\"/data/sec_3:label\"><value>\u2500\u2500 SECTION 3 \u2014 BENEFICIARY VERIFICATION \u2500\u2500</value></text>\n          <text id=\"/data/bene_name:label\"><value>Beneficiary / Recipient Name *</value></text>\n          <text id=\"/data/bene_name:hint\"><value>Full name of person receiving inputs</value></text>\n          <text id=\"/data/bene_group:label\"><value>Cooperative / Group Name *</value></text>\n          <text id=\"/data/bene_phone:label\"><value>Recipient Phone Number</value></text>\n          <text id=\"/data/bene_phone:hint\"><value>Mobile number (e.g. 076123456)</value></text>\n          <text id=\"/data/bene_id_scan:label\"><value>Scan Beneficiary ID Card (Optional)</value></text>\n          <text id=\"/data/bene_id_scan:hint\"><value>Scan the beneficiary ID or membership card barcode</value></text>\n          <text id=\"/data/village:label\"><value>Village / Community *</value></text>\n          <text id=\"/data/district:label\"><value>District *</value></text>\n\n          <text id=\"/data/sec_4:label\"><value>\u2500\u2500 SECTION 4 \u2014 ITEMS RECEIVED (ADD A ROW PER ITEM TYPE) \u2500\u2500</value></text>\n          <text id=\"/data/items_received:label\"><value>Items Received</value></text>\n          <text id=\"/data/items_received:hint\"><value>Add one row for each different type of input received</value></text>\n          <text id=\"/data/items_received/item_barcode:label\"><value>Scan Item Barcode *</value></text>\n          <text id=\"/data/items_received/item_barcode:hint\"><value>Scan the barcode on the bag / box / container (e.g. INV-00001)</value></text>\n          <text id=\"/data/items_received/proc_code:label\"><value>Procurement Code *</value></text>\n          <text id=\"/data/items_received/proc_code:hint\"><value>Scan procurement batch barcode or type code (e.g. PC-2025-001)</value></text>\n          <text id=\"/data/items_received/item_name:label\"><value>Item Name *</value></text>\n          <text id=\"/data/items_received/item_name:hint\"><value>Enter full name if barcode unavailable (e.g. NPK Fertilizer 17:17:17)</value></text>\n          <text id=\"/data/items_received/item_category:label\"><value>Category *</value></text>\n          <text id=\"/data/items_received/qty_expected:label\"><value>Quantity Expected (Ordered)</value></text>\n          <text id=\"/data/items_received/qty_expected:hint\"><value>Quantity shown on the distribution / procurement order</value></text>\n          <text id=\"/data/items_received/qty_received:label\"><value>Quantity Actually Received *</value></text>\n          <text id=\"/data/items_received/qty_received:hint\"><value>Count carefully then enter the exact number</value></text>\n          <text id=\"/data/items_received/qty_variance:label\"><value>Variance (auto-calculated)</value></text>\n          <text id=\"/data/items_received/qty_variance:hint\"><value>Positive = surplus \u00b7 Negative = shortfall \u00b7 Zero = exact match</value></text>\n          <text id=\"/data/items_received/unit:label\"><value>Unit *</value></text>\n          <text id=\"/data/items_received/item_condition:label\"><value>Condition of this Item *</value></text>\n          <text id=\"/data/items_received/item_condition:hint\"><value>Inspect packaging and contents before selecting</value></text>\n          <text id=\"/data/items_received/item_notes:label\"><value>Notes / Damage Description</value></text>\n          <text id=\"/data/items_received/item_notes:hint\"><value>Describe any damage, discrepancy, or issue with this item</value></text>\n\n          <text id=\"/data/sec_5:label\"><value>\u2500\u2500 SECTION 5 \u2014 OVERALL DELIVERY ASSESSMENT \u2500\u2500</value></text>\n          <text id=\"/data/overall_condition:label\"><value>Overall Delivery Condition *</value></text>\n          <text id=\"/data/overall_condition:hint\"><value>Assess the full delivery as a whole</value></text>\n          <text id=\"/data/delivery_notes:label\"><value>Delivery Notes / Observations</value></text>\n          <text id=\"/data/delivery_problem:label\"><value>Was there a problem? *</value></text>\n          <text id=\"/data/problem_description:label\"><value>Describe the Problem *</value></text>\n          <text id=\"/data/problem_description:hint\"><value>Explain what went wrong in as much detail as possible</value></text>\n\n          <text id=\"/data/sec_6:label\"><value>\u2500\u2500 SECTION 6 \u2014 PHOTO EVIDENCE \u2500\u2500</value></text>\n          <text id=\"/data/photo_items:label\"><value>\ud83d\udcf8 Photo of Items Received *</value></text>\n          <text id=\"/data/photo_items:hint\"><value>Take a clear photo showing all items together</value></text>\n          <text id=\"/data/photo_condition:label\"><value>\ud83d\udcf8 Photo of Item Condition / Damage</value></text>\n          <text id=\"/data/photo_condition:hint\"><value>Show any damage, torn packaging, or wet bags</value></text>\n          <text id=\"/data/photo_id:label\"><value>\ud83d\udcf8 Photo of Beneficiary ID (Optional)</value></text>\n          <text id=\"/data/photo_id:hint\"><value>Photograph the recipient's national ID or cooperative card</value></text>\n\n          <text id=\"/data/sec_7:label\"><value>\u2500\u2500 SECTION 7 \u2014 ACKNOWLEDGMENT &amp; SIGNATURE \u2500\u2500</value></text>\n          <text id=\"/data/signed_at:label\"><value>Signing Location / Premises *</value></text>\n          <text id=\"/data/signed_at:hint\"><value>Name of the site where the form is being signed (e.g. Waterloo Cooperative HQ)</value></text>\n          <text id=\"/data/sig_instruction:label\"><value>\u270d\ufe0f Ask the beneficiary to acknowledge receipt.</value></text>\n          <text id=\"/data/sig_instruction:hint\"><value>Read aloud: 'I confirm I have received all items listed in the condition described.'</value></text>\n          <text id=\"/data/sig_name:label\"><value>Recipient Signature Name *</value></text>\n          <text id=\"/data/sig_name:hint\"><value>Print the full name of the person signing</value></text>\n          <text id=\"/data/sig_photo:label\"><value>\ud83d\udcf8 Photo of Signed Paper Form *</value></text>\n          <text id=\"/data/sig_photo:hint\"><value>Photograph the paper form showing the beneficiary's signature</value></text>\n          <text id=\"/data/confirmed:label\"><value>Did beneficiary verbally confirm receipt? *</value></text>\n\n          <text id=\"/data/ready:label\"><value>\u2705 Review all fields then press SUBMIT.</value></text>\n          <text id=\"/data/ready:hint\"><value>The data will sync to AgroFlow automatically when you have internet.</value></text>\n\n        </translation>\n      </itext>\n\n      <!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 INSTANCE (data model) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n      <instance>\n        <data id=\"agroflow_pod_v2\" version=\"2025040101\">\n          <intro/>\n          <!-- Section 1: Officer & Vehicle -->\n          <sec_1/>\n          <officer_id/>\n          <officer_name/>\n          <vehicle/>\n          <device_type>phone</device_type>\n          <gps_location/>\n          <delivery_datetime/>\n          <!-- Section 2: Distribution Lookup & Season -->\n          <sec_2/>\n          <dist_ref/>\n          <dist_ref_manual/>\n          <final_dist_ref/>\n          <season/>\n          <!-- Section 3: Beneficiary -->\n          <sec_3/>\n          <bene_name/>\n          <bene_group/>\n          <bene_phone/>\n          <bene_id_scan/>\n          <village/>\n          <district/>\n          <!-- Section 4: Items Received (repeat) -->\n          <sec_4/>\n          <items_received jr:template=\"\">\n            <item_barcode/>\n            <proc_code/>\n            <item_name/>\n            <item_category/>\n            <qty_expected/>\n            <qty_received/>\n            <qty_variance/>\n            <unit/>\n            <item_condition/>\n            <item_notes/>\n          </items_received>\n          <!-- default first row so officer sees the repeat immediately -->\n          <items_received>\n            <item_barcode/>\n            <proc_code/>\n            <item_name/>\n            <item_category/>\n            <qty_expected/>\n            <qty_received/>\n            <qty_variance/>\n            <unit/>\n            <item_condition/>\n            <item_notes/>\n          </items_received>\n          <!-- Section 5: Overall Assessment -->\n          <sec_5/>\n          <overall_condition/>\n          <delivery_notes/>\n          <delivery_problem>no</delivery_problem>\n          <problem_description/>\n          <!-- Section 6: Photos -->\n          <sec_6/>\n          <photo_items/>\n          <photo_condition/>\n          <photo_id/>\n          <!-- Section 7: Signature & Acknowledgment -->\n          <sec_7/>\n          <signed_at/>\n          <sig_instruction/>\n          <sig_name/>\n          <sig_photo/>\n          <confirmed/>\n          <ready/>\n          <meta>\n            <instanceID/>\n            <instanceName/>\n          </meta>\n        </data>\n      </instance>\n\n      <!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 Secondary instances (choice lists) \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n      <instance id=\"device_type\">\n        <root>\n          <item><itextId>device_type-0</itextId><name>phone</name></item>\n          <item><itextId>device_type-1</itextId><name>tablet</name></item>\n          <item><itextId>device_type-2</itextId><name>scanner</name></item>\n        </root>\n      </instance>\n\n      <instance id=\"season\">\n        <root>\n          <item><itextId>season-0</itextId><name>2025_long_rains</name></item>\n          <item><itextId>season-1</itextId><name>2025_short_rains</name></item>\n          <item><itextId>season-2</itextId><name>2026_long_rains</name></item>\n          <item><itextId>season-3</itextId><name>2026_short_rains</name></item>\n        </root>\n      </instance>\n\n      <instance id=\"district\">\n        <root>\n          <item><itextId>district-0</itextId><name>western_area</name></item>\n          <item><itextId>district-1</itextId><name>bo</name></item>\n          <item><itextId>district-2</itextId><name>bombali</name></item>\n          <item><itextId>district-3</itextId><name>kenema</name></item>\n          <item><itextId>district-4</itextId><name>kono</name></item>\n          <item><itextId>district-5</itextId><name>port_loko</name></item>\n          <item><itextId>district-6</itextId><name>tonkolili</name></item>\n          <item><itextId>district-7</itextId><name>kailahun</name></item>\n          <item><itextId>district-8</itextId><name>moyamba</name></item>\n          <item><itextId>district-9</itextId><name>bonthe</name></item>\n          <item><itextId>district-10</itextId><name>pujehun</name></item>\n          <item><itextId>district-11</itextId><name>kambia</name></item>\n          <item><itextId>district-12</itextId><name>koinadugu</name></item>\n        </root>\n      </instance>\n\n      <instance id=\"item_category\">\n        <root>\n          <item><itextId>item_category-0</itextId><name>seeds</name></item>\n          <item><itextId>item_category-1</itextId><name>fertilizer</name></item>\n          <item><itextId>item_category-2</itextId><name>pesticide</name></item>\n          <item><itextId>item_category-3</itextId><name>herbicide</name></item>\n          <item><itextId>item_category-4</itextId><name>tools</name></item>\n          <item><itextId>item_category-5</itextId><name>other</name></item>\n        </root>\n      </instance>\n\n      <instance id=\"unit\">\n        <root>\n          <item><itextId>unit-0</itextId><name>kg</name></item>\n          <item><itextId>unit-1</itextId><name>bags_50kg</name></item>\n          <item><itextId>unit-2</itextId><name>litres</name></item>\n          <item><itextId>unit-3</itextId><name>units</name></item>\n          <item><itextId>unit-4</itextId><name>boxes</name></item>\n        </root>\n      </instance>\n\n      <instance id=\"item_condition\">\n        <root>\n          <item><itextId>item_condition-0</itextId><name>good</name></item>\n          <item><itextId>item_condition-1</itextId><name>minor</name></item>\n          <item><itextId>item_condition-2</itextId><name>damaged</name></item>\n          <item><itextId>item_condition-3</itextId><name>rejected</name></item>\n        </root>\n      </instance>\n\n      <instance id=\"overall_condition\">\n        <root>\n          <item><itextId>overall_condition-0</itextId><name>good</name></item>\n          <item><itextId>overall_condition-1</itextId><name>partial</name></item>\n          <item><itextId>overall_condition-2</itextId><name>damaged</name></item>\n          <item><itextId>overall_condition-3</itextId><name>failed</name></item>\n        </root>\n      </instance>\n\n      <instance id=\"delivery_problem\">\n        <root>\n          <item><itextId>delivery_problem-0</itextId><name>no</name></item>\n          <item><itextId>delivery_problem-1</itextId><name>yes</name></item>\n        </root>\n      </instance>\n\n      <instance id=\"confirmed\">\n        <root>\n          <item><itextId>confirmed-0</itextId><name>yes</name></item>\n          <item><itextId>confirmed-1</itextId><name>no</name></item>\n        </root>\n      </instance>\n\n      <!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 BINDINGS \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n\n      <!-- Intro -->\n      <bind nodeset=\"/data/intro\"           readonly=\"true()\" type=\"string\"/>\n\n      <!-- Section 1 \u2014 Officer & Vehicle -->\n      <bind nodeset=\"/data/sec_1\"           readonly=\"true()\" type=\"string\"/>\n      <bind nodeset=\"/data/officer_id\"      type=\"string\"\n            constraint=\"regex(.,'FO-[0-9]{3}')\"\n            jr:constraintMsg=\"Must match format FO-001\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/officer_name\"    type=\"string\"\n            constraint=\"string-length(.) &gt; 2\"\n            jr:constraintMsg=\"Enter full name\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/vehicle\"         type=\"string\"\n            constraint=\"string-length(.) &gt; 2\"\n            jr:constraintMsg=\"Enter truck plate or code\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/device_type\"     type=\"string\" required=\"true()\"/>\n      <bind nodeset=\"/data/gps_location\"    type=\"geopoint\" required=\"true()\" jr:requiredMsg=\"GPS required\"/>\n      <bind nodeset=\"/data/delivery_datetime\" type=\"dateTime\" required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <setvalue ref=\"/data/delivery_datetime\" event=\"odk-instance-first-load\" value=\"now()\"/>\n\n      <!-- Section 2 \u2014 Distribution Lookup & Season -->\n      <bind nodeset=\"/data/sec_2\"           readonly=\"true()\" type=\"string\"/>\n      <bind nodeset=\"/data/dist_ref\"        type=\"string\"\n            constraint=\"regex(.,'AG-[0-9]{4}-[0-9]{6}')\"\n            jr:constraintMsg=\"Must be a valid distribution ref e.g. AG-2025-001847\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/dist_ref_manual\" type=\"string\"\n            required=\"false()\"\n            relevant=\"/data/dist_ref = ''\"/>\n      <bind nodeset=\"/data/final_dist_ref\"  type=\"string\"\n            calculate=\"if(/data/dist_ref != '', /data/dist_ref, /data/dist_ref_manual)\"/>\n      <bind nodeset=\"/data/season\"          type=\"string\" required=\"true()\" jr:requiredMsg=\"Required\"/>\n\n      <!-- Section 3 \u2014 Beneficiary -->\n      <bind nodeset=\"/data/sec_3\"           readonly=\"true()\" type=\"string\"/>\n      <bind nodeset=\"/data/bene_name\"       type=\"string\"\n            constraint=\"string-length(.) &gt; 2\"\n            jr:constraintMsg=\"Enter at least 3 characters\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/bene_group\"      type=\"string\" required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/bene_phone\"      type=\"string\" required=\"false()\"/>\n      <bind nodeset=\"/data/bene_id_scan\"    type=\"string\" required=\"false()\"/>\n      <bind nodeset=\"/data/village\"         type=\"string\" required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/district\"        type=\"string\" required=\"true()\" jr:requiredMsg=\"Required\"/>\n\n      <!-- Section 4 \u2014 Items Received (repeat) -->\n      <bind nodeset=\"/data/sec_4\"                              readonly=\"true()\" type=\"string\"/>\n      <bind nodeset=\"/data/items_received/item_barcode\"        type=\"string\"\n            constraint=\"regex(.,'INV-[0-9]{5}')\"\n            jr:constraintMsg=\"Must match format INV-00001\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/items_received/proc_code\"           type=\"string\"\n            constraint=\"regex(.,'PC-[0-9]{4}-[0-9]{3}')\"\n            jr:constraintMsg=\"Must match format PC-2025-001\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/items_received/item_name\"           type=\"string\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/items_received/item_category\"       type=\"string\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/items_received/qty_expected\"        type=\"decimal\"\n            constraint=\". &gt;= 0\"\n            jr:constraintMsg=\"Cannot be negative\"\n            required=\"false()\"/>\n      <bind nodeset=\"/data/items_received/qty_received\"        type=\"decimal\"\n            constraint=\". &gt; 0\"\n            jr:constraintMsg=\"Must be greater than 0\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <!-- auto-calculated: positive = surplus, negative = shortfall, 0 = exact -->\n      <bind nodeset=\"/data/items_received/qty_variance\"        type=\"decimal\"\n            calculate=\"if(/data/items_received/qty_expected != '',\n                          /data/items_received/qty_received - /data/items_received/qty_expected,\n                          0)\"\n            readonly=\"true()\"/>\n      <bind nodeset=\"/data/items_received/unit\"                type=\"string\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/items_received/item_condition\"      type=\"string\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/items_received/item_notes\"          type=\"string\"\n            required=\"false()\"/>\n\n      <!-- Section 5 \u2014 Overall Assessment -->\n      <bind nodeset=\"/data/sec_5\"              readonly=\"true()\" type=\"string\"/>\n      <bind nodeset=\"/data/overall_condition\"  type=\"string\" required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/delivery_notes\"     type=\"string\" required=\"false()\"/>\n      <bind nodeset=\"/data/delivery_problem\"   type=\"string\" required=\"true()\"/>\n      <bind nodeset=\"/data/problem_description\" type=\"string\"\n            required=\"true()\" jr:requiredMsg=\"Required if problem\"\n            relevant=\"/data/delivery_problem = 'yes'\"/>\n\n      <!-- Section 6 \u2014 Photos -->\n      <bind nodeset=\"/data/sec_6\"              readonly=\"true()\" type=\"string\"/>\n      <bind nodeset=\"/data/photo_items\"        type=\"binary\" required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/photo_condition\"    type=\"binary\" required=\"false()\"/>\n      <bind nodeset=\"/data/photo_id\"           type=\"binary\" required=\"false()\"/>\n\n      <!-- Section 7 \u2014 Signature & Acknowledgment -->\n      <bind nodeset=\"/data/sec_7\"              readonly=\"true()\" type=\"string\"/>\n      <bind nodeset=\"/data/signed_at\"          type=\"string\"\n            constraint=\"string-length(.) &gt; 3\"\n            jr:constraintMsg=\"Enter the signing location name\"\n            required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/sig_instruction\"    readonly=\"true()\" type=\"string\"/>\n      <bind nodeset=\"/data/sig_name\"           type=\"string\" required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/sig_photo\"          type=\"binary\" required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/confirmed\"          type=\"string\" required=\"true()\" jr:requiredMsg=\"Required\"/>\n      <bind nodeset=\"/data/ready\"              readonly=\"true()\" type=\"string\"/>\n\n      <!-- Instance metadata -->\n      <bind nodeset=\"/data/meta/instanceID\"   type=\"string\" readonly=\"true()\" jr:preload=\"uid\"/>\n      <!-- instanceName: POD-YYYYMMDD-FO-xxx-distRef4chars e.g. POD-20250315-FO-001-1847 -->\n      <bind nodeset=\"/data/meta/instanceName\" type=\"string\"\n            calculate=\"concat('POD-',\n                              format-date(today(),'%Y%m%d'), '-',\n                              /data/officer_id, '-',\n                              substring(/data/final_dist_ref, 13, 4))\"/>\n\n    </model>\n  </h:head>\n\n  <!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 BODY / FORM UI \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\n  <h:body>\n\n    <!-- Intro screen -->\n    <input ref=\"/data/intro\">\n      <label ref=\"jr:itext('/data/intro:label')\"/>\n      <hint ref=\"jr:itext('/data/intro:hint')\"/>\n    </input>\n\n    <!-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 SECTION 1: FIELD OFFICER & VEHICLE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->\n    <input ref=\"/data/sec_1\">\n      <label ref=\"jr:itext('/data/sec_1:label')\"/>\n    </input>\n\n    <input ref=\"/data/officer_id\" appearance=\"barcode\">\n      <label ref=\"jr:itext('/data/officer_id:label')\"/>\n      <hint ref=\"jr:itext('/data/officer_id:hint')\"/>\n    </input>\n\n    <input ref=\"/data/officer_name\">\n      <label ref=\"jr:itext('/data/officer_name:label')\"/>\n    </input>\n\n    <!-- NEW: Vehicle / truck plate -->\n    <input ref=\"/data/vehicle\" appearance=\"barcode\">\n      <label ref=\"jr:itext('/data/vehicle:label')\"/>\n      <hint ref=\"jr:itext('/data/vehicle:hint')\"/>\n    </input>\n\n    <select1 ref=\"/data/device_type\">\n      <label ref=\"jr:itext('/data/device_type:label')\"/>\n      <hint ref=\"jr:itext('/data/device_type:hint')\"/>\n      <itemset nodeset=\"instance('device_type')/root/item\">\n        <value ref=\"name\"/>\n        <label ref=\"jr:itext(itextId)\"/>\n      </itemset>\n    </select1>\n\n    <input ref=\"/data/gps_location\" appearance=\"placement-map\">\n      <label ref=\"jr:itext('/data/gps_location:label')\"/>\n      <hint ref=\"jr:itext('/data/gps_location:hint')\"/>\n    </input>\n\n    <input ref=\"/data/delivery_datetime\">\n      <label ref=\"jr:itext('/data/delivery_datetime:label')\"/>\n    </input>\n\n    <!-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 SECTION 2: DISTRIBUTION LOOKUP & SEASON \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->\n    <input ref=\"/data/sec_2\">\n      <label ref=\"jr:itext('/data/sec_2:label')\"/>\n    </input>\n\n    <input ref=\"/data/dist_ref\" appearance=\"barcode\">\n      <label ref=\"jr:itext('/data/dist_ref:label')\"/>\n      <hint ref=\"jr:itext('/data/dist_ref:hint')\"/>\n    </input>\n\n    <input ref=\"/data/dist_ref_manual\">\n      <label ref=\"jr:itext('/data/dist_ref_manual:label')\"/>\n      <hint ref=\"jr:itext('/data/dist_ref_manual:hint')\"/>\n    </input>\n\n    <!-- NEW: Agricultural season -->\n    <select1 ref=\"/data/season\">\n      <label ref=\"jr:itext('/data/season:label')\"/>\n      <hint ref=\"jr:itext('/data/season:hint')\"/>\n      <itemset nodeset=\"instance('season')/root/item\">\n        <value ref=\"name\"/>\n        <label ref=\"jr:itext(itextId)\"/>\n      </itemset>\n    </select1>\n\n    <!-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 SECTION 3: BENEFICIARY VERIFICATION \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->\n    <input ref=\"/data/sec_3\">\n      <label ref=\"jr:itext('/data/sec_3:label')\"/>\n    </input>\n\n    <input ref=\"/data/bene_name\">\n      <label ref=\"jr:itext('/data/bene_name:label')\"/>\n      <hint ref=\"jr:itext('/data/bene_name:hint')\"/>\n    </input>\n\n    <input ref=\"/data/bene_group\">\n      <label ref=\"jr:itext('/data/bene_group:label')\"/>\n    </input>\n\n    <input ref=\"/data/bene_phone\">\n      <label ref=\"jr:itext('/data/bene_phone:label')\"/>\n      <hint ref=\"jr:itext('/data/bene_phone:hint')\"/>\n    </input>\n\n    <input ref=\"/data/bene_id_scan\" appearance=\"barcode\">\n      <label ref=\"jr:itext('/data/bene_id_scan:label')\"/>\n      <hint ref=\"jr:itext('/data/bene_id_scan:hint')\"/>\n    </input>\n\n    <input ref=\"/data/village\">\n      <label ref=\"jr:itext('/data/village:label')\"/>\n    </input>\n\n    <select1 ref=\"/data/district\">\n      <label ref=\"jr:itext('/data/district:label')\"/>\n      <itemset nodeset=\"instance('district')/root/item\">\n        <value ref=\"name\"/>\n        <label ref=\"jr:itext(itextId)\"/>\n      </itemset>\n    </select1>\n\n    <!-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 SECTION 4: ITEMS RECEIVED \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->\n    <input ref=\"/data/sec_4\">\n      <label ref=\"jr:itext('/data/sec_4:label')\"/>\n    </input>\n\n    <group ref=\"/data/items_received\">\n      <label ref=\"jr:itext('/data/items_received:label')\"/>\n      <repeat nodeset=\"/data/items_received\">\n\n        <!-- scan inventory barcode (INV-00001 format) -->\n        <input ref=\"/data/items_received/item_barcode\" appearance=\"barcode\">\n          <label ref=\"jr:itext('/data/items_received/item_barcode:label')\"/>\n          <hint ref=\"jr:itext('/data/items_received/item_barcode:hint')\"/>\n        </input>\n\n        <!-- NEW: scan / type procurement code -->\n        <input ref=\"/data/items_received/proc_code\" appearance=\"barcode\">\n          <label ref=\"jr:itext('/data/items_received/proc_code:label')\"/>\n          <hint ref=\"jr:itext('/data/items_received/proc_code:hint')\"/>\n        </input>\n\n        <input ref=\"/data/items_received/item_name\">\n          <label ref=\"jr:itext('/data/items_received/item_name:label')\"/>\n          <hint ref=\"jr:itext('/data/items_received/item_name:hint')\"/>\n        </input>\n\n        <select1 ref=\"/data/items_received/item_category\">\n          <label ref=\"jr:itext('/data/items_received/item_category:label')\"/>\n          <itemset nodeset=\"instance('item_category')/root/item\">\n            <value ref=\"name\"/>\n            <label ref=\"jr:itext(itextId)\"/>\n          </itemset>\n        </select1>\n\n        <input ref=\"/data/items_received/qty_expected\">\n          <label ref=\"jr:itext('/data/items_received/qty_expected:label')\"/>\n          <hint ref=\"jr:itext('/data/items_received/qty_expected:hint')\"/>\n        </input>\n\n        <input ref=\"/data/items_received/qty_received\">\n          <label ref=\"jr:itext('/data/items_received/qty_received:label')\"/>\n          <hint ref=\"jr:itext('/data/items_received/qty_received:hint')\"/>\n        </input>\n\n        <!-- NEW: auto-calculated variance \u2014 shown read-only so officer can verify on screen -->\n        <input ref=\"/data/items_received/qty_variance\" readonly=\"true()\">\n          <label ref=\"jr:itext('/data/items_received/qty_variance:label')\"/>\n          <hint ref=\"jr:itext('/data/items_received/qty_variance:hint')\"/>\n        </input>\n\n        <select1 ref=\"/data/items_received/unit\">\n          <label ref=\"jr:itext('/data/items_received/unit:label')\"/>\n          <itemset nodeset=\"instance('unit')/root/item\">\n            <value ref=\"name\"/>\n            <label ref=\"jr:itext(itextId)\"/>\n          </itemset>\n        </select1>\n\n        <select1 ref=\"/data/items_received/item_condition\">\n          <label ref=\"jr:itext('/data/items_received/item_condition:label')\"/>\n          <hint ref=\"jr:itext('/data/items_received/item_condition:hint')\"/>\n          <itemset nodeset=\"instance('item_condition')/root/item\">\n            <value ref=\"name\"/>\n            <label ref=\"jr:itext(itextId)\"/>\n          </itemset>\n        </select1>\n\n        <input ref=\"/data/items_received/item_notes\">\n          <label ref=\"jr:itext('/data/items_received/item_notes:label')\"/>\n          <hint ref=\"jr:itext('/data/items_received/item_notes:hint')\"/>\n        </input>\n\n      </repeat>\n    </group>\n\n    <!-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 SECTION 5: OVERALL ASSESSMENT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->\n    <input ref=\"/data/sec_5\">\n      <label ref=\"jr:itext('/data/sec_5:label')\"/>\n    </input>\n\n    <select1 ref=\"/data/overall_condition\">\n      <label ref=\"jr:itext('/data/overall_condition:label')\"/>\n      <hint ref=\"jr:itext('/data/overall_condition:hint')\"/>\n      <itemset nodeset=\"instance('overall_condition')/root/item\">\n        <value ref=\"name\"/>\n        <label ref=\"jr:itext(itextId)\"/>\n      </itemset>\n    </select1>\n\n    <input ref=\"/data/delivery_notes\">\n      <label ref=\"jr:itext('/data/delivery_notes:label')\"/>\n    </input>\n\n    <select1 ref=\"/data/delivery_problem\">\n      <label ref=\"jr:itext('/data/delivery_problem:label')\"/>\n      <itemset nodeset=\"instance('delivery_problem')/root/item\">\n        <value ref=\"name\"/>\n        <label ref=\"jr:itext(itextId)\"/>\n      </itemset>\n    </select1>\n\n    <input ref=\"/data/problem_description\">\n      <label ref=\"jr:itext('/data/problem_description:label')\"/>\n      <hint ref=\"jr:itext('/data/problem_description:hint')\"/>\n    </input>\n\n    <!-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 SECTION 6: PHOTO EVIDENCE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->\n    <input ref=\"/data/sec_6\">\n      <label ref=\"jr:itext('/data/sec_6:label')\"/>\n    </input>\n\n    <upload ref=\"/data/photo_items\" mediatype=\"image/*\">\n      <label ref=\"jr:itext('/data/photo_items:label')\"/>\n      <hint ref=\"jr:itext('/data/photo_items:hint')\"/>\n    </upload>\n\n    <upload ref=\"/data/photo_condition\" mediatype=\"image/*\">\n      <label ref=\"jr:itext('/data/photo_condition:label')\"/>\n      <hint ref=\"jr:itext('/data/photo_condition:hint')\"/>\n    </upload>\n\n    <upload ref=\"/data/photo_id\" mediatype=\"image/*\">\n      <label ref=\"jr:itext('/data/photo_id:label')\"/>\n      <hint ref=\"jr:itext('/data/photo_id:hint')\"/>\n    </upload>\n\n    <!-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 SECTION 7: SIGNATURE & ACKNOWLEDGMENT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->\n    <input ref=\"/data/sec_7\">\n      <label ref=\"jr:itext('/data/sec_7:label')\"/>\n    </input>\n\n    <!-- NEW: Signing location name -->\n    <input ref=\"/data/signed_at\">\n      <label ref=\"jr:itext('/data/signed_at:label')\"/>\n      <hint ref=\"jr:itext('/data/signed_at:hint')\"/>\n    </input>\n\n    <input ref=\"/data/sig_instruction\">\n      <label ref=\"jr:itext('/data/sig_instruction:label')\"/>\n      <hint ref=\"jr:itext('/data/sig_instruction:hint')\"/>\n    </input>\n\n    <input ref=\"/data/sig_name\">\n      <label ref=\"jr:itext('/data/sig_name:label')\"/>\n      <hint ref=\"jr:itext('/data/sig_name:hint')\"/>\n    </input>\n\n    <upload ref=\"/data/sig_photo\" mediatype=\"image/*\">\n      <label ref=\"jr:itext('/data/sig_photo:label')\"/>\n      <hint ref=\"jr:itext('/data/sig_photo:hint')\"/>\n    </upload>\n\n    <select1 ref=\"/data/confirmed\">\n      <label ref=\"jr:itext('/data/confirmed:label')\"/>\n      <itemset nodeset=\"instance('confirmed')/root/item\">\n        <value ref=\"name\"/>\n        <label ref=\"jr:itext(itextId)\"/>\n      </itemset>\n    </select1>\n\n    <input ref=\"/data/ready\">\n      <label ref=\"jr:itext('/data/ready:label')\"/>\n      <hint ref=\"jr:itext('/data/ready:hint')\"/>\n    </input>\n\n  </h:body>\n</h:html>\n"

// ─── Constants ────────────────────────────────────────────────────────────────
const FORM_ID      = "agroflow_pod_v2";
const FORM_VERSION = "2025040101";
const FORM_NAME    = "AgroFlow — Proof of Delivery v2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY       = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Supabase helpers ─────────────────────────────────────────────────────────
const sbHdrs = () => ({
  "Content-Type": "application/json",
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  Prefer: "return=representation",
});

async function sbUpsert(table: string, rec: Record<string, unknown>) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...sbHdrs(), Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rec),
  });
  if (!r.ok) throw new Error(`sbUpsert ${table}: ${await r.text()}`);
  return r.json();
}

async function sbPatch(table: string, col: string, val: string, data: Record<string, unknown>) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${encodeURIComponent(val)}`, {
    method: "PATCH",
    headers: sbHdrs(),
    body: JSON.stringify(data),
  });
  if (!r.ok) console.warn(`sbPatch ${table}: ${await r.text()}`);
}

// ─── OpenRosa standard response headers ──────────────────────────────────────
function orHeaders(extra: Record<string, string> = {}): Headers {
  const h = new Headers({
    "X-OpenRosa-Version": "1.0",
    "X-OpenRosa-Accept-Content-Length": "20971520",  // 20 MB
    "Date": new Date().toUTCString(),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-OpenRosa-Version, X-OpenRosa-Accept-Content-Length",
    ...extra,
  });
  return h;
}

// ─── Endpoint: GET /formList ──────────────────────────────────────────────────
// ODK Collect calls this first to discover available forms.
function handleFormList(baseUrl: string): Response {
  const downloadUrl = `${baseUrl}/form-download?formId=${FORM_ID}`;
  const manifestUrl = `${baseUrl}/manifest?formId=${FORM_ID}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<xforms xmlns="http://openrosa.org/xforms/xformsList">
  <xform>
    <formID>${FORM_ID}</formID>
    <name>${FORM_NAME}</name>
    <version>${FORM_VERSION}</version>
    <hash>md5:${simpleHash(XFORM_XML)}</hash>
    <downloadUrl>${downloadUrl}</downloadUrl>
    <manifestUrl>${manifestUrl}</manifestUrl>
    <descriptionText>AgroFlow POD form for field officers. Records delivery proof with barcode scanning.</descriptionText>
  </xform>
</xforms>`;

  const h = orHeaders({ "Content-Type": "text/xml; charset=UTF-8" });
  return new Response(xml, { status: 200, headers: h });
}

// ─── Endpoint: GET /form-download ────────────────────────────────────────────
// Returns the XForm XML so ODK Collect can store it locally.
function handleFormDownload(): Response {
  const h = orHeaders({ "Content-Type": "text/xml; charset=UTF-8" });
  return new Response(XFORM_XML, { status: 200, headers: h });
}

// ─── Endpoint: GET /manifest ─────────────────────────────────────────────────
// Media manifest — empty (no external media files for this form).
function handleManifest(): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://openrosa.org/xforms/xformsManifest">
</manifest>`;
  const h = orHeaders({ "Content-Type": "text/xml; charset=UTF-8" });
  return new Response(xml, { status: 200, headers: h });
}

// ─── Endpoint: HEAD /submission ───────────────────────────────────────────────
// ODK Collect checks server capabilities before submitting.
function handleSubmissionHead(): Response {
  const h = orHeaders({ "Location": "" });
  return new Response(null, { status: 204, headers: h });
}

// ─── Endpoint: POST /submission ───────────────────────────────────────────────
// Receives the multipart/form-data submission from ODK Collect.
// The submission contains:
//   - xml_submission_file : the XML instance data (text/xml)
//   - *                   : any photo/media attachments
async function handleSubmission(req: Request, baseUrl: string): Promise<Response> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return new Response(
      openRosaError("Could not parse multipart submission"),
      { status: 400, headers: orHeaders({ "Content-Type": "text/xml; charset=UTF-8" }) },
    );
  }

  const xmlFile = formData.get("xml_submission_file");
  if (!xmlFile || typeof xmlFile === "string") {
    return new Response(
      openRosaError("Missing xml_submission_file in submission"),
      { status: 422, headers: orHeaders({ "Content-Type": "text/xml; charset=UTF-8" }) },
    );
  }

  const xmlText = await (xmlFile as File).text();

  // Collect attachment filenames (photos etc.)
  const attachments: string[] = [];
  for (const [key, val] of formData.entries()) {
    if (key !== "xml_submission_file" && val instanceof File) {
      attachments.push(val.name || key);
    }
  }

  // Parse the ODK XML submission into a flat JS object
  let submission: Record<string, unknown>;
  try {
    submission = parseODKXML(xmlText);
  } catch (e) {
    return new Response(
      openRosaError(`XML parse error: ${(e as Error).message}`),
      { status: 422, headers: orHeaders({ "Content-Type": "text/xml; charset=UTF-8" }) },
    );
  }

  // Map to AgroFlow POD record
  const pod = mapToPOD(submission, attachments);

  try {
    await sbUpsert("pods", pod);
    console.log(`[OpenRosa] POD saved: ${pod.ref}`);
  } catch (e) {
    console.error("[OpenRosa] DB error:", e);
    return new Response(
      openRosaError(`Server error: ${(e as Error).message}`),
      { status: 500, headers: orHeaders({ "Content-Type": "text/xml; charset=UTF-8" }) },
    );
  }

  // Update distribution status based on delivery outcome
  const distRef = pod.dist_ref as string;
  const hasProblem = pod.problem_reported as boolean;
  if (distRef) {
    const newStatus = hasProblem ? "Problem" : "Delivered";
    await sbPatch("distributions", "ref", distRef, {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
  }

  // OpenRosa success response — 201 Created
  const successXml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenRosaResponse xmlns="http://openrosa.org/http/response">
  <message nature="submit_success">
    Submission received. POD Reference: ${pod.ref}
  </message>
</OpenRosaResponse>`;

  const h = orHeaders({ "Content-Type": "text/xml; charset=UTF-8" });
  return new Response(successXml, { status: 201, headers: h });
}

// ─── ODK XML parser ───────────────────────────────────────────────────────────
// Parses the ODK submission XML into a flat key→value map.
// Handles the repeat group (items_received) as an array.
function parseODKXML(xml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Extract instanceID from meta block
  const instanceId = extractTag(xml, "instanceID") || extractAttr(xml, "instanceID");
  if (instanceId) result["meta_instanceID"] = instanceId;

  // Top-level simple fields
  const topFields = [
    "officer_id","officer_name","vehicle","device_type","delivery_datetime",
    "dist_ref","dist_ref_manual","final_dist_ref","season",
    "bene_name","bene_group","bene_phone","bene_id_scan","village","district",
    "gps_location","overall_condition","delivery_notes",
    "delivery_problem","problem_description",
    "photo_items","photo_condition","photo_id",
    "signed_at","sig_name","sig_photo","confirmed",
  ];
  for (const f of topFields) {
    const v = extractTag(xml, f);
    if (v !== null) result[f] = v;
  }

  // Repeat group: items_received
  const items: Record<string, unknown>[] = [];
  const repeatRegex = /<items_received>([\s\S]*?)<\/items_received>/g;
  let m: RegExpExecArray | null;
  while ((m = repeatRegex.exec(xml)) !== null) {
    const chunk = m[1];
    const qtyExp = Number(extractTag(chunk, "qty_expected") || 0);
    const qtyRec = Number(extractTag(chunk, "qty_received") || 0);
    items.push({
      item_barcode:   extractTag(chunk, "item_barcode")   || "",
      proc_code:      extractTag(chunk, "proc_code")      || "",
      item_name:      extractTag(chunk, "item_name")      || "",
      item_category:  extractTag(chunk, "item_category")  || "",
      qty_expected:   qtyExp,
      qty_received:   qtyRec,
      qty_variance:   qtyExp > 0 ? qtyRec - qtyExp : Number(extractTag(chunk, "qty_variance") || 0),
      unit:           extractTag(chunk, "unit")           || "",
      item_condition: extractTag(chunk, "item_condition") || "",
      item_notes:     extractTag(chunk, "item_notes")     || "",
    });
  }
  result["items_received"] = items;
  return result;
}

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, "i");
  const m  = re.exec(xml);
  return m ? m[1].trim() : null;
}

function extractAttr(xml: string, attr: string): string | null {
  const re = new RegExp(`${attr}="([^"]*)"`, "i");
  const m  = re.exec(xml);
  return m ? m[1] : null;
}

// ─── Map parsed ODK submission → AgroFlow POD record ─────────────────────────
function mapToPOD(
  sub: Record<string, unknown>,
  attachments: string[],
): Record<string, unknown> {
  const now      = new Date().toISOString();
  const distRef  = (sub.final_dist_ref as string) || (sub.dist_ref as string) || "";
  const offId    = (sub.officer_id    as string) || "";
  const dt       = (sub.delivery_datetime as string) || now;
  const datePart = dt.slice(0, 10).replace(/-/g, "");
  const podRef   = `POD-${datePart}-${offId.replace("FO-", "")}-${distRef.slice(-6) || "000000"}`;

  const gps      = (sub.gps_location as string) || "";
  const [latStr, lonStr] = gps.split(" ");
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  const items = (sub.items_received as Record<string, unknown>[]) || [];
  const allOk = items.length > 0
              && items.every((it) =>
                  it.item_condition !== "damaged" && it.item_condition !== "rejected");
  const hasProblem = (sub.delivery_problem as string) === "yes" || !allOk;

  return {
    ref:                   podRef,
    dist_ref:              distRef,
    source:                "odk_collect_openrosa",
    odk_instance_id:       (sub.meta_instanceID as string) || "",

    officer_id:            offId,
    officer_name:          (sub.officer_name as string) || "",
    vehicle:               (sub.vehicle      as string) || "",
    device_type:           (sub.device_type  as string) || "",
    season:                (sub.season       as string) || "",

    bene_name:             (sub.bene_name  as string) || "",
    bene_group:            (sub.bene_group as string) || "",
    bene_phone:            (sub.bene_phone as string) || "",
    bene_id_scan:          (sub.bene_id_scan as string) || "",
    village:               (sub.village    as string) || "",
    district:              (sub.district   as string) || "",

    received_by:           (sub.sig_name   as string) || (sub.bene_name as string) || "",
    date:                  dt.slice(0, 10),
    time:                  dt.length > 10 ? dt.slice(11, 16) : "",
    delivery_datetime:     dt,

    items,

    condition:             (sub.overall_condition as string) || "good",
    delivery_notes:        (sub.delivery_notes   as string) || "",
    problem_reported:      hasProblem,
    problem_description:   (sub.problem_description as string) || "",

    verified:              false,
    beneficiary_confirmed: (sub.confirmed as string) === "yes",
    signed_at:             (sub.signed_at as string) || "",

    gps_lat:               isNaN(lat) ? null : lat,
    gps_lon:               isNaN(lon) ? null : lon,

    photos:                attachments,

    submitted_at:          now,
    updated_at:            now,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function openRosaError(msg: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenRosaResponse xmlns="http://openrosa.org/http/response">
  <message nature="error">${msg}</message>
</OpenRosaResponse>`;
}

/** Very lightweight hash for the form manifest (not crypto-secure) */
function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0");
}

// ─── Main router ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: orHeaders() });
  }

  const url  = new URL(req.url);
  // After /functions/v1/openrosa, the remaining path is the endpoint
  // e.g.  /functions/v1/openrosa/formList
  //       /functions/v1/openrosa/submission
  const path = url.pathname.replace(/^\/functions\/v1\/openrosa/, "") || "/";
  const base = `${url.protocol}//${url.host}/functions/v1/openrosa`;

  console.log(`[OpenRosa] ${req.method} ${path}`);

  if (req.method === "GET" && path === "/formList") return handleFormList(base);
  if (req.method === "GET" && path === "/form-download") return handleFormDownload();
  if (req.method === "GET" && path === "/manifest")     return handleManifest();
  if (req.method === "HEAD" && path === "/submission")  return handleSubmissionHead();
  if (req.method === "GET"  && path === "/submission")  return handleSubmissionHead();
  if (req.method === "POST" && path === "/submission")  return handleSubmission(req, base);

  // Health check / root
  if (path === "/" || path === "") {
    return new Response(
      JSON.stringify({
        server: "AgroFlow OpenRosa Server",
        version: "1.0",
        formId: FORM_ID,
        endpoints: ["/formList", "/form-download", "/manifest", "/submission"],
      }),
      { status: 200, headers: orHeaders({ "Content-Type": "application/json" }) },
    );
  }

  return new Response(
    openRosaError(`Unknown endpoint: ${path}`),
    { status: 404, headers: orHeaders({ "Content-Type": "text/xml; charset=UTF-8" }) },
  );
});
