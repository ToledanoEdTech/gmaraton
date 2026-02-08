// =====================================================
// גמרתון ישיבת צביה אלישיב לוד - Google Apps Script
// =====================================================
var TOTAL_SUGIOT = 35;
var TOTAL_KARTISIOT = 11;
var POINTS_PER_ITEM = 10;
var BONUS_FOR_FULL_CLASS = 300;

function doPost(e) {
  try {
    console.log("=== NEW REQUEST STARTED ===");
    console.log("Raw request:", e);

    // בדוק אם יש נתונים
    if (!e.postData || !e.postData.contents) {
      console.log("ERROR: No postData received");
      return createJsonResponse({
        success: false,
        error: "לא התקבלו נתונים"
      });
    }

    // נתח את ה-JSON
    var data;
    try {
      data = JSON.parse(e.postData.contents);
      console.log("Parsed data:", JSON.stringify(data));
      console.log("Data type:", typeof data);
      console.log("Data.type value:", data.type);
      console.log("Is classBonus?", data.type === 'classBonus');
    } catch (parseError) {
      console.log("ERROR: Failed to parse JSON:", parseError);
      console.log("Raw contents:", e.postData.contents);
      return createJsonResponse({
        success: false,
        error: "נתונים לא תקינים: " + parseError.message
      });
    }

    // בדוק אם זה עדכון בונוס כיתתי או עדכון ניקוד תלמיד
    console.log("Checking if type is classBonus. data.type =", data.type, "comparison result:", data.type === 'classBonus');
    if (data.type === 'classBonus') {
      // עדכון בונוס כיתתי
      console.log("=== CLASS BONUS UPDATE REQUEST ===");
      console.log("Received data:", JSON.stringify(data));
      
      var studentGrade = data.grade ? data.grade.toString().trim() : '';
      var bonusToSet = parseFloat(data.bonus) || 0;

      console.log("Parsed grade: '" + studentGrade + "', Parsed bonus: " + bonusToSet);
      console.log("Grade is empty?", !studentGrade);
      console.log("Bonus is NaN?", isNaN(bonusToSet));

      if (!studentGrade || isNaN(bonusToSet)) {
        console.log("ERROR: Missing required fields for class bonus");
        return createJsonResponse({
          success: false,
          error: "חסרים נתונים נדרשים: כיתה או בונוס",
          receivedData: data
        });
      }

      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!spreadsheet) {
        console.log("ERROR: Could not access spreadsheet");
        return createJsonResponse({
          success: false,
          error: "לא ניתן לגשת לגיליון"
        });
      }

      console.log("Looking for sheet with grade name: '" + studentGrade + "'");
      var sheet = findGradeSheet(spreadsheet, studentGrade);
      if (!sheet) {
        console.log("ERROR: Sheet not found for grade: " + studentGrade);
        // List all available sheets for debugging
        var allSheets = spreadsheet.getSheets();
        var sheetNames = [];
        for (var i = 0; i < allSheets.length; i++) {
          sheetNames.push(allSheets[i].getName());
        }
        console.log("Available sheets:", sheetNames.join(", "));
        return createJsonResponse({
          success: false,
          error: "לא נמצא גיליון לכיתה: " + studentGrade,
          availableSheets: sheetNames
        });
      }

      console.log("Found sheet: " + sheet.getName());
      
      // עדכן את הבונוס הכיתתי בעמודה D שורה 2 (אינדקס 1 במערך, עמודה 4)
      var bonusColumnIndex = 3; // עמודה D (אינדקס 3 במערך = עמודה 4 בפועל)
      var bonusRowIndex = 1; // שורה 2 (אינדקס 1 במערך = שורה 2 בפועל)
      var targetRow = bonusRowIndex + 1; // שורה 2 בפועל
      var targetColumn = bonusColumnIndex + 1; // עמודה D בפועל (עמודה 4)
      
      console.log("Sheet name: " + sheet.getName());
      console.log("Sheet has " + sheet.getLastRow() + " rows and " + sheet.getLastColumn() + " columns");
      console.log("Updating cell at row " + targetRow + ", column " + targetColumn + " (D2) with value: " + bonusToSet);
      
      // Ensure the sheet has enough rows and columns
      if (sheet.getLastRow() < targetRow) {
        console.log("Sheet doesn't have row " + targetRow + ", ensuring it exists...");
        sheet.getRange(targetRow, 1).setValue(""); // Create the row if it doesn't exist
      }
      if (sheet.getLastColumn() < targetColumn) {
        console.log("Sheet doesn't have column " + targetColumn + ", ensuring it exists...");
        sheet.getRange(1, targetColumn).setValue(""); // Create the column if it doesn't exist
      }
      
      // Read current value before update
      var targetRange = sheet.getRange(targetRow, targetColumn);
      var currentValue = targetRange.getValue();
      console.log("Current value in cell D2: '" + currentValue + "' (type: " + typeof currentValue + ", isEmpty: " + (currentValue === "" || currentValue === null || currentValue === undefined) + ")");
      
      // Write the new value
      console.log("Writing value " + bonusToSet + " to cell D2...");
      targetRange.setValue(bonusToSet);
      SpreadsheetApp.flush();
      
      // Wait a moment and verify the update
      Utilities.sleep(200); // Small delay to ensure write completes
      
      // Read the value again to verify
      var newValue = targetRange.getValue();
      console.log("New value in cell D2 after update: '" + newValue + "' (type: " + typeof newValue + ", isEmpty: " + (newValue === "" || newValue === null || newValue === undefined) + ")");
      
      // Double check by reading the entire row
      var rowData = sheet.getRange(targetRow, 1, 1, Math.max(targetColumn, sheet.getLastColumn())).getValues()[0];
      console.log("Full row 2 data:", rowData);
      console.log("Value at column D (index 3):", rowData[bonusColumnIndex]);
      
      // Verify the value was written correctly
      var verifiedValue = parseFloat(newValue);
      if (isNaN(verifiedValue) || verifiedValue !== bonusToSet) {
        console.log("WARNING: Value verification failed! Expected: " + bonusToSet + ", Got: " + newValue);
        // Try writing again
        targetRange.setValue(bonusToSet);
        SpreadsheetApp.flush();
        Utilities.sleep(200);
        newValue = targetRange.getValue();
        verifiedValue = parseFloat(newValue);
        console.log("After retry, value is: " + newValue);
      }

      console.log("=== CLASS BONUS UPDATE SUCCESSFUL ===");
      return createJsonResponse({
        success: true,
        message: "בונוס כיתתי עודכן בהצלחה",
        grade: studentGrade,
        bonus: bonusToSet,
        previousValue: currentValue !== null && currentValue !== undefined ? currentValue.toString() : "",
        newValue: newValue !== null && newValue !== undefined ? newValue.toString() : "",
        sheetName: sheet.getName(),
        targetCell: "D" + targetRow
      });
    }

    // עדכון סוגיות וכרטיסיות לתלמיד — מערכים (אילו סוגיות/כרטיסיות סיים)
    if (data.type === 'updateSugiotKartisiot') {
      var uName = data.name ? data.name.toString().trim() : '';
      var uGrade = data.grade ? data.grade.toString().trim() : '';
      var uSugiotArr = ensureNumberArray(data.sugiotCompleted, 1, TOTAL_SUGIOT);
      var uKartisiotArr = ensureNumberArray(data.kartisiotCompleted, 1, TOTAL_KARTISIOT);

      if (!uName || !uGrade) {
        return createJsonResponse({ success: false, error: "חסרים שם או כיתה" });
      }

      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!spreadsheet) {
        return createJsonResponse({ success: false, error: "לא ניתן לגשת לגיליון" });
      }
      var sheet = findGradeSheet(spreadsheet, uGrade);
      if (!sheet) {
        return createJsonResponse({ success: false, error: "לא נמצא גיליון לכיתה: " + uGrade });
      }

      var allData = sheet.getDataRange().getValues();
      if (allData.length < 2) {
        return createJsonResponse({ success: false, error: "אין מספיק נתונים בגיליון" });
      }

      var nameCol = 1, scoreCol = 2, sugiotCol = 4, kartisiotCol = 5, dataStart = 3;
      var studentInfo = findStudent(allData, nameCol, scoreCol, dataStart, uName);
      if (!studentInfo.found) {
        return createJsonResponse({
          success: false,
          error: "תלמיד לא נמצא: " + uName,
          triedNames: studentInfo.triedNames
        });
      }

      var row = studentInfo.rowIndex + 1;
      // קריאה מפורשת של השורה עם 6 עמודות (A–F) כדי לקבל תמיד E,F גם אם getDataRange לא כלל אותם
      var currentRow = sheet.getRange(row, 1, row, 6).getValues()[0];
      var currentC = parseFloat(currentRow[scoreCol]) || 0;
      var oldSugArr = parseCommaSeparatedNumbers(currentRow[sugiotCol], 1, TOTAL_SUGIOT);
      var oldKartArr = parseCommaSeparatedNumbers(currentRow[kartisiotCol], 1, TOTAL_KARTISIOT);
      if (oldSugArr.length === 0 && currentRow[sugiotCol] !== undefined && currentRow[sugiotCol] !== null && currentRow[sugiotCol] !== '') {
        var singleS = parseInt(currentRow[sugiotCol], 10);
        if (!isNaN(singleS) && singleS > 0) { for (var si = 1; si <= Math.min(singleS, TOTAL_SUGIOT); si++) oldSugArr.push(si); }
      }
      if (oldKartArr.length === 0 && currentRow[kartisiotCol] !== undefined && currentRow[kartisiotCol] !== null && currentRow[kartisiotCol] !== '') {
        var singleK = parseInt(currentRow[kartisiotCol], 10);
        if (!isNaN(singleK) && singleK > 0) { for (var ki = 1; ki <= Math.min(singleK, TOTAL_KARTISIOT); ki++) oldKartArr.push(ki); }
      }
      var oldPts = (oldSugArr.length + oldKartArr.length) * POINTS_PER_ITEM;
      var newPts = (uSugiotArr.length + uKartisiotArr.length) * POINTS_PER_ITEM;
      var newTotal = currentC - oldPts + newPts;
      if (newTotal < 0) newTotal = 0;

      // כתיבה לעמודה C (ניקוד), E (סוגיות), F (כרטיסיות) — 1-based
      sheet.getRange(row, 3).setValue(newTotal);
      sheet.getRange(row, 5).setValue(uSugiotArr.length > 0 ? uSugiotArr.sort(function(a,b){return a-b;}).join(',') : '');
      sheet.getRange(row, 6).setValue(uKartisiotArr.length > 0 ? uKartisiotArr.sort(function(a,b){return a-b;}).join(',') : '');
      SpreadsheetApp.flush();
      Utilities.sleep(500);

      return createJsonResponse({
        success: true,
        message: "סוגיות וכרטיסיות עודכנו, ניקוד עודכן בקובץ",
        student: uName,
        grade: uGrade,
        sugiotCompleted: uSugiotArr,
        kartisiotCompleted: uKartisiotArr
      });
    }

    // עדכון ניקוד תלמיד (הקוד הקיים)
    var studentName = data.name ? data.name.toString().trim() : '';
    var studentGrade = data.grade ? data.grade.toString().trim() : '';
    var pointsToAdd = parseInt(data.points) || 0;

    console.log("Student: '" + studentName + "', Grade: '" + studentGrade + "', Points: " + pointsToAdd);

    // בדוק שכל הנתונים קיימים
    if (!studentName || !studentGrade || isNaN(pointsToAdd)) {
      console.log("ERROR: Missing required fields");
      return createJsonResponse({
        success: false,
        error: "חסרים נתונים נדרשים: שם, כיתה, או נקודות"
      });
    }

    // קבל את הגיליון
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      console.log("ERROR: Could not access spreadsheet");
      return createJsonResponse({
        success: false,
        error: "לא ניתן לגשת לגיליון"
      });
    }

    console.log("Spreadsheet accessed successfully");

    // חפש את הגיליון של הכיתה
    var sheet = findGradeSheet(spreadsheet, studentGrade);
    if (!sheet) {
      console.log("ERROR: Sheet not found for grade: " + studentGrade);
      return createJsonResponse({
        success: false,
        error: "לא נמצא גיליון לכיתה: " + studentGrade
      });
    }

    console.log("Found sheet: " + sheet.getName());

    // קבל את כל הנתונים מהגיליון
    var allData = sheet.getDataRange().getValues();
    if (allData.length < 2) {
      console.log("ERROR: Sheet has insufficient data");
      return createJsonResponse({
        success: false,
        error: "אין מספיק נתונים בגיליון"
      });
    }

    console.log("Sheet has " + allData.length + " rows");

    // לפי המבנה שתיארת: שמות בעמודה B (אינדקס 1), ניקוד בעמודה C (אינדקס 2)
    // מתחיל משורה 4 (אינדקס 3 במערך)
    var nameColumnIndex = 1; // עמודה B
    var scoreColumnIndex = 2; // עמודה C
    var dataStartRow = 3; // שורה 4 (אינדקס 3 במערך)

    console.log("Using fixed columns - Name: column " + (nameColumnIndex + 1) + ", Score: column " + (scoreColumnIndex + 1));

    // חפש את התלמיד החל משורה 4
    var studentInfo = findStudent(allData, nameColumnIndex, scoreColumnIndex, dataStartRow, studentName);
    if (!studentInfo.found) {
      console.log("ERROR: Student not found. Tried variations:", studentInfo.triedNames);
      return createJsonResponse({
        success: false,
        error: "תלמיד לא נמצא: " + studentName,
        triedNames: studentInfo.triedNames,
        availableStudents: studentInfo.availableStudents
      });
    }

    console.log("Found student at row " + studentInfo.rowIndex);

    // עדכן את הניקוד
    var currentScore = parseFloat(allData[studentInfo.rowIndex][scoreColumnIndex]) || 0;
    var newScore = currentScore + pointsToAdd;

    console.log("Updating score: " + currentScore + " + " + pointsToAdd + " = " + newScore);

    // עדכן את התא
    sheet.getRange(studentInfo.rowIndex + 1, scoreColumnIndex + 1).setValue(newScore);
    SpreadsheetApp.flush();

    console.log("=== UPDATE SUCCESSFUL ===");

    return createJsonResponse({
      success: true,
      message: "עודכן בהצלחה",
      student: studentName,
      grade: studentGrade,
      oldScore: currentScore,
      newScore: newScore,
      pointsAdded: pointsToAdd
    });

  } catch (error) {
    console.log("=== UNEXPECTED ERROR ===");
    console.error("Error:", error);
    return createJsonResponse({
      success: false,
      error: "שגיאה לא צפויה: " + error.message
    });
  }
}

function doGet(e) {
  try {
    console.log("=== GET REQUEST STARTED ===");

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      console.log("ERROR: Could not access spreadsheet");
      return createJsonResponse({
        students: [],
        classBonuses: {}
      });
    }

    var allSheets = spreadsheet.getSheets();
    var allStudents = [];
    var classBonuses = {};
    var classProgress = {}; // לכל כיתה: sugiotCounts, kartisiotCounts, studentCount, autoBonus

    console.log("Processing " + allSheets.length + " sheets");

    for (var i = 0; i < allSheets.length; i++) {
      var sheet = allSheets[i];
      var sheetName = sheet.getName();
      console.log("Processing sheet: " + sheetName);

      var lastRow = Math.max(sheet.getLastRow(), 2);
      var lastCol = Math.max(sheet.getLastColumn(), 6);
      var sheetData = sheet.getRange(1, 1, lastRow, lastCol).getValues();

      if (sheetData.length < 2) {
        console.log("Skipping sheet " + sheetName + " - no data");
        continue;
      }

      var bonusColumnIndex = 3;
      var bonusRowIndex = 1;
      var classBonus = 0;

      if (sheetData.length > bonusRowIndex) {
        var bonusRow = sheetData[bonusRowIndex];
        if (bonusRow && bonusRow.length > bonusColumnIndex && bonusRow[bonusColumnIndex] !== undefined && bonusRow[bonusColumnIndex] !== null && bonusRow[bonusColumnIndex] !== "") {
          var bonusValue = parseFloat(bonusRow[bonusColumnIndex]);
          if (!isNaN(bonusValue) && bonusValue > 0) {
            classBonus = bonusValue;
          }
        }
      }

      var nameColumnIndex = 1;
      var scoreColumnIndex = 2;
      var sugiotColumnIndex = 4;
      var kartisiotColumnIndex = 5;
      var dataStartRow = 3;

      var sugiotCounts = [];
      var kartisiotCounts = [];
      for (var s = 0; s < TOTAL_SUGIOT; s++) sugiotCounts.push(0);
      for (var k = 0; k < TOTAL_KARTISIOT; k++) kartisiotCounts.push(0);

      for (var row = dataStartRow; row < sheetData.length; row++) {
        var studentName = sheetData[row][nameColumnIndex];
        var studentScore = sheetData[row][scoreColumnIndex];
        var sugiotCell = sheetData[row][sugiotColumnIndex];
        var kartisiotCell = sheetData[row][kartisiotColumnIndex];
        var studentSugiotArr = parseCommaSeparatedNumbers(sugiotCell, 1, TOTAL_SUGIOT);
        var studentKartisiotArr = parseCommaSeparatedNumbers(kartisiotCell, 1, TOTAL_KARTISIOT);
        if (studentSugiotArr.length === 0 && sugiotCell !== undefined && sugiotCell !== null && sugiotCell !== '') {
          var singleSug = parseInt(sugiotCell, 10);
          if (!isNaN(singleSug) && singleSug > 0) {
            for (var si = 1; si <= Math.min(singleSug, TOTAL_SUGIOT); si++) studentSugiotArr.push(si);
          }
        }
        if (studentKartisiotArr.length === 0 && kartisiotCell !== undefined && kartisiotCell !== null && kartisiotCell !== '') {
          var singleKart = parseInt(kartisiotCell, 10);
          if (!isNaN(singleKart) && singleKart > 0) {
            for (var ki = 1; ki <= Math.min(singleKart, TOTAL_KARTISIOT); ki++) studentKartisiotArr.push(ki);
          }
        }

        if (studentName && studentName.toString().trim()) {
          var parsedScore = parseFloat(studentScore) || 0;
          var totalScore = parsedScore;

          for (var si = 0; si < TOTAL_SUGIOT; si++) {
            if (studentSugiotArr.indexOf(si + 1) !== -1) sugiotCounts[si] = (sugiotCounts[si] || 0) + 1;
          }
          for (var ki = 0; ki < TOTAL_KARTISIOT; ki++) {
            if (studentKartisiotArr.indexOf(ki + 1) !== -1) kartisiotCounts[ki] = (kartisiotCounts[ki] || 0) + 1;
          }

          allStudents.push({
            id: 'sheet_' + sheetName + '_row_' + row,
            name: studentName.toString().trim(),
            grade: sheetName,
            score: totalScore,
            sugiotCompleted: studentSugiotArr,
            kartisiotCompleted: studentKartisiotArr,
            sugiot: studentSugiotArr.length,
            kartisiot: studentKartisiotArr.length
          });
        }
      }

      var studentCount = 0;
      for (var r = dataStartRow; r < sheetData.length; r++) {
        if (sheetData[r][nameColumnIndex] && sheetData[r][nameColumnIndex].toString().trim()) studentCount++;
      }

      var fullSugiotCount = 0;
      var fullKartisiotCount = 0;
      for (var si = 0; si < TOTAL_SUGIOT; si++) {
        if (studentCount > 0 && sugiotCounts[si] === studentCount) fullSugiotCount++;
      }
      for (var ki = 0; ki < TOTAL_KARTISIOT; ki++) {
        if (studentCount > 0 && kartisiotCounts[ki] === studentCount) fullKartisiotCount++;
      }
      var autoBonus = (fullSugiotCount + fullKartisiotCount) * BONUS_FOR_FULL_CLASS;
      classBonuses[sheetName] = classBonus + autoBonus;

      classProgress[sheetName] = {
        grade: sheetName,
        studentCount: studentCount,
        sugiotCounts: sugiotCounts,
        kartisiotCounts: kartisiotCounts,
        autoBonus: autoBonus
      };
    }

    console.log("Returning " + allStudents.length + " students");
    return createJsonResponse({
      students: allStudents,
      classBonuses: classBonuses,
      classProgress: classProgress
    });

  } catch (error) {
    console.error("Error in doGet:", error);
    return createJsonResponse({
      students: [],
      classBonuses: {}
    });
  }
}

// =====================================================
// פונקציות עזר
// =====================================================

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function findGradeSheet(spreadsheet, grade) {
  // נסה שמות שונים לכיתה
  var possibleNames = [
    grade,
    grade.replace('יי', 'י"י'),
    grade.replace('י', 'י"'),
    'כיתה ' + grade,
    grade.replace('יי', 'יב'),
    grade.replace('י', 'יא'),
    // הוסף וריאציות נוספות
    grade.replace('1ה', 'ח1'),
    grade.replace('ח1', '1ה'),
    grade.replace('2ה', 'ח2'),
    grade.replace('ח2', '2ה'),
    grade.replace('3ה', 'ח3'),
    grade.replace('ח3', '3ה'),
    grade.replace('4ה', 'ח4'),
    grade.replace('ח4', '4ה'),
    grade.replace('5ה', 'ח5'),
    grade.replace('ח5', '5ה'),
    'כיתה ' + grade.replace('1ה', 'ח1'),
    'כיתה ' + grade.replace('2ה', 'ח2'),
    'כיתה ' + grade.replace('3ה', 'ח3'),
    'כיתה ' + grade.replace('4ה', 'ח4'),
    'כיתה ' + grade.replace('5ה', 'ח5')
  ];

  console.log("Searching for sheet with grade: '" + grade + "'");
  console.log("Trying " + possibleNames.length + " possible names");

  // First try exact matches
  for (var i = 0; i < possibleNames.length; i++) {
    var sheet = spreadsheet.getSheetByName(possibleNames[i]);
    if (sheet) {
      console.log("Found sheet with exact name: '" + possibleNames[i] + "'");
      return sheet;
    }
  }

  // If not found, try partial matches
  console.log("Sheet not found with exact match, searching all sheets for partial match...");
  var allSheets = spreadsheet.getSheets();
  var normalizedGrade = grade.toLowerCase().replace(/\s+/g, '');
  
  for (var j = 0; j < allSheets.length; j++) {
    var sheetName = allSheets[j].getName();
    var normalizedSheetName = sheetName.toLowerCase().replace(/\s+/g, '');
    
    // בדוק אם שם הגיליון מכיל את שם הכיתה או להיפך
    if (normalizedSheetName === normalizedGrade || 
        normalizedSheetName.indexOf(normalizedGrade) !== -1 || 
        normalizedGrade.indexOf(normalizedSheetName) !== -1 ||
        // בדוק גם אם יש התאמה חלקית (למשל "1n" מתאים ל"1נ")
        (normalizedGrade.length >= 2 && normalizedSheetName.length >= 2 && 
         normalizedGrade.charAt(0) === normalizedSheetName.charAt(0) && 
         normalizedGrade.charAt(normalizedGrade.length - 1) === normalizedSheetName.charAt(normalizedSheetName.length - 1))) {
      console.log("Found similar sheet: '" + sheetName + "' (searched for: '" + grade + "')");
      return allSheets[j];
    }
  }

  console.log("Sheet not found for grade: '" + grade + "'");
  console.log("Available sheets:", allSheets.map(function(s) { return s.getName(); }).join(", "));
  return null;
}

function findColumns(headers) {
  var nameIndex = -1;
  var scoreIndex = -1;

  for (var i = 0; i < headers.length; i++) {
    var header = headers[i].toString().toLowerCase();

    if (header.includes('שם') && nameIndex === -1) {
      nameIndex = i;
    }

    if ((header.includes('ניקוד') || header.includes('score') || header.includes('ציון')) && scoreIndex === -1) {
      scoreIndex = i;
    }
  }

  return {
    nameIndex: nameIndex,
    scoreIndex: scoreIndex
  };
}

function findStudent(allData, nameColumnIndex, scoreColumnIndex, dataStartRow, searchName) {
  var trimmedSearchName = searchName.trim();
  var triedNames = [trimmedSearchName];
  var availableStudents = [];

  // צור וריאציות של השם
  if (trimmedSearchName.indexOf(' ') !== -1) {
    var nameParts = trimmedSearchName.split(' ');
    if (nameParts.length === 2) {
      // הפוך שם פרטי ומשפחה
      triedNames.push(nameParts[1] + ' ' + nameParts[0]);
      // נסה גם עם מקף
      triedNames.push(nameParts[0] + '-' + nameParts[1]);
      triedNames.push(nameParts[1] + '-' + nameParts[0]);
    }
  }

  console.log("Trying name variations:", triedNames);

  // חפש החל מהשורה שצוינה (שורה 4 = אינדקס 3)
  for (var row = dataStartRow; row < allData.length; row++) {
    var sheetStudentName = allData[row][nameColumnIndex];

    if (sheetStudentName) {
      var trimmedSheetName = sheetStudentName.toString().trim();

      // אסוף שמות זמינים לדיבוג
      if (availableStudents.length < 20) {
        availableStudents.push(trimmedSheetName);
      }

      // בדוק אם אחד מהשמות מתאים
      for (var i = 0; i < triedNames.length; i++) {
        if (trimmedSheetName === triedNames[i]) {
          console.log("Found match: '" + trimmedSheetName + "' with variation '" + triedNames[i] + "' at row " + (row + 1));
          return {
            found: true,
            rowIndex: row,
            triedNames: triedNames,
            availableStudents: availableStudents
          };
        }
      }
    }
  }

  return {
    found: false,
    rowIndex: -1,
    triedNames: triedNames,
    availableStudents: availableStudents
  };
}

/** מפרק תא (מחרוזת או מספר) לרשימת מספרים בטווח minNum..maxNum, ללא כפילות */
function parseCommaSeparatedNumbers(cellValue, minNum, maxNum) {
  var out = [];
  if (cellValue === undefined || cellValue === null) return out;
  var str = cellValue.toString().trim();
  if (!str) return out;
  var parts = str.split(/[\s,]+/);
  var seen = {};
  for (var p = 0; p < parts.length; p++) {
    var num = parseInt(parts[p], 10);
    if (!isNaN(num) && num >= minNum && num <= maxNum && !seen[num]) {
      seen[num] = true;
      out.push(num);
    }
  }
  return out;
}

/** ממיר למערך מספרים בטווח, ללא כפילות */
function ensureNumberArray(arr, minNum, maxNum) {
  var out = [];
  if (!arr || !Array.isArray(arr)) return out;
  var seen = {};
  for (var i = 0; i < arr.length; i++) {
    var num = parseInt(arr[i], 10);
    if (!isNaN(num) && num >= minNum && num <= maxNum && !seen[num]) {
      seen[num] = true;
      out.push(num);
    }
  }
  return out;
}