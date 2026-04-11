/**
 * PESUmate - Open Source PPTX to PDF Converter
 * This is a Google Apps Script that acts as a serverless webhook.
 * 
 * Instructions to Deploy:
 * 1. Go to https://script.google.com/ and create a "New Project".
 * 2. Name it "PESUmate PPTX to PDF".
 * 3. Copy and paste this entire code into `Code.gs`.
 * 4. IMPORTANT: Give your script access to the Drive API.
 *    - Click "Services" on the left sidebar (the plus icon).
 *    - Select "Drive API" (version v2 or v3) and click "Add".
 * 5. Click "Deploy" -> "New deployment" in the top right.
 * 6. Select Type -> "Web app" (click the gear icon to see types).
 * 7. Set:
 *    - Execute as: "Me (<your email>)"
 *    - Who has access: "Anyone"
 * 8. Click "Deploy". It will ask for permissions, click "Review Permissions" -> "Allow".
 * 9. Copy the "Web app URL" (it starts with https://script.google.com/macros/s/.../exec).
 * 10. Paste this URL into your PESUmate extension options!
 */

function doPost(e) {
  try {
    // We expect the payload to be a JSON string with base64 encoded data
    var requestData = JSON.parse(e.postData.contents);
    var filename = requestData.filename || "presentation.pptx";
    var base64Data = requestData.fileData;
    
    // 1. Decode the base64 string to blob
    var dataBytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(dataBytes, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', filename);
    
    // 2. Insert into Drive and convert to Google Slides format automatically
    var fileId;
    
    // Check if user enabled Drive API v2 or v3
    if (typeof Drive.Files.insert === 'function') {
      var fileMetaV2 = {
        title: filename,
        mimeType: "application/vnd.google-apps.presentation"
      };
      var convertedFileV2 = Drive.Files.insert(fileMetaV2, blob, {convert: true});
      fileId = convertedFileV2.id;
    } else if (typeof Drive.Files.create === 'function') {
      var fileMetaV3 = {
        name: filename,
        mimeType: "application/vnd.google-apps.presentation"
      };
      var convertedFileV3 = Drive.Files.create(fileMetaV3, blob);
      fileId = convertedFileV3.id;
    } else {
      throw new Error("Drive API not enabled. Please enable Drive API in Services.");
    }
    
    // 3. Export the converted Google Slides presentation as a PDF
    var exportUrl = "https://docs.google.com/presentation/d/" + fileId + "/export/pdf";
    var token = ScriptApp.getOAuthToken();
    var pdfResponse = UrlFetchApp.fetch(exportUrl, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    // 4. Clean up - DELETE the file from your Google Drive so it consumes 0 storage
    // You will never hit quota limits as the file exists for only a few seconds.
    Drive.Files.remove(fileId);
    
    // 5. Return the PDF as base64 so Chrome Extension can merge it
    var pdfBase64 = Utilities.base64Encode(pdfResponse.getBlob().getBytes());
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      pdfBase64: pdfBase64
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle CORS preflight requests
 */
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
