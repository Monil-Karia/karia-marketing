# Karia Marketing — Admin Guide

## How to Add a New Product (Super Easy!)

1. Take a photo of your product (any size, any format — JPG, PNG are fine)

2. Rename the photo file like this:
   ```
   ProductName_Price_YES_Quantity.jpg
   ```

   **Examples:**
   - `NeckMassager_1499_YES_25.jpg` → Neck Massager, ₹1499, returnable, 25 in stock
   - `WirelessCharger_899_NO_10.jpg` → Wireless Charger, ₹899, NOT returnable, 10 in stock
   - `BluetoothSpeaker_2200_YES_5.jpg` → Bluetooth Speaker, ₹2200, returnable, 5 in stock

   **Rules:**
   - Use underscore `_` to separate each part
   - YES = product can be returned/replaced
   - NO = product cannot be returned
   - Last number = how many units you have in stock

3. Copy the renamed photo into the `admin-uploads` folder

4. Tell your developer to run: `npm run process-images`
   (In future, this can be made automatic)

5. Done! The product will appear on the website.

---

## How to Update Stock (via Excel)

The file `inventory.xlsx` automatically updates when orders come in.

To update stock after receiving new items:
1. Open `inventory.xlsx`
2. Find the product row
3. Update the `quantity` column
4. Save the file
5. Run: `npm run sync-inventory`

---

## Folder Structure (what goes where)

```
admin-uploads/          ← Put new product images here
admin-uploads/done/     ← Processed images move here automatically
inventory.xlsx          ← Stock management file
```
