// =====================================================
// גמרתון ישיבת צביה אלישיב לוד - Google Apps Script
// =====================================================

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
    var classBonuses = {}; // אובייקט שמכיל את הבונוסים הכיתתיים: { "כיתה": בונוס }

    console.log("Processing " + allSheets.length + " sheets");

    for (var i = 0; i < allSheets.length; i++) {
      var sheet = allSheets[i];
      var sheetName = sheet.getName();
      console.log("Processing sheet: " + sheetName);

      var sheetData = sheet.getDataRange().getValues();

      if (sheetData.length < 2) {
        console.log("Skipping sheet " + sheetName + " - no data");
        continue;
      }

      // קריאת בונוס כיתתי מעמודה D שורה 2 (אינדקס 1 במערך, עמודה 4 בפועל)
      var bonusColumnIndex = 3; // עמודה D (אינדקס 3 במערך = עמודה 4 בפועל)
      var bonusRowIndex = 1; // שורה 2 (אינדקס 1 במערך = שורה 2 בפועל)
      var classBonus = 0;
      
      console.log("Reading bonus for sheet: " + sheetName);
      console.log("Sheet data length: " + sheetData.length);
      console.log("Looking for bonus at row index " + bonusRowIndex + ", column index " + bonusColumnIndex);
      
      if (sheetData.length > bonusRowIndex) {
        var row = sheetData[bonusRowIndex];
        console.log("Row 2 data:", row);
        if (row && row.length > bonusColumnIndex && row[bonusColumnIndex] !== undefined && row[bonusColumnIndex] !== null && row[bonusColumnIndex] !== "") {
          var bonusValue = parseFloat(row[bonusColumnIndex]);
          console.log("Raw bonus value: '" + row[bonusColumnIndex] + "', parsed: " + bonusValue);
          if (!isNaN(bonusValue) && bonusValue > 0) {
            classBonus = bonusValue;
            console.log("Found class bonus for " + sheetName + ": " + classBonus);
          } else {
            console.log("Bonus value is not a valid number or is 0");
          }
        } else {
          console.log("Bonus cell is empty or undefined");
        }
      } else {
        console.log("Sheet doesn't have row 2 yet");
      }
      classBonuses[sheetName] = classBonus;

      // לפי המבנה שתיארת: שמות בעמודה B (אינדקס 1), ניקוד בעמודה C (אינדקס 2)
      // מתחיל משורה 4 (אינדקס 3 במערך)
      var nameColumnIndex = 1; // עמודה B
      var scoreColumnIndex = 2; // עמודה C
      var dataStartRow = 3; // שורה 4 (אינדקס 3 במערך)

      for (var row = dataStartRow; row < sheetData.length; row++) {
        var studentName = sheetData[row][nameColumnIndex];
        var studentScore = sheetData[row][scoreColumnIndex];

        if (studentName && studentName.toString().trim()) {
          var parsedScore = parseFloat(studentScore) || 0;
          allStudents.push({
            id: 'sheet_' + sheetName + '_row_' + row,
            name: studentName.toString().trim(),
            grade: sheetName,
            score: parsedScore
          });
        }
      }
    }

    console.log("Returning " + allStudents.length + " students");
    return createJsonResponse({
      students: allStudents,
      classBonuses: classBonuses
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