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
      console.log("Parsed data:", data);
    } catch (parseError) {
      console.log("ERROR: Failed to parse JSON:", parseError);
      return createJsonResponse({
        success: false,
        error: "נתונים לא תקינים: " + parseError.message
      });
    }

    // חלץ את הנתונים
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
      return createJsonResponse([]);
    }

    var allSheets = spreadsheet.getSheets();
    var allStudents = [];

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
    return createJsonResponse(allStudents);

  } catch (error) {
    console.error("Error in doGet:", error);
    return createJsonResponse([]);
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
    grade.replace('י', 'יא')
  ];

  for (var i = 0; i < possibleNames.length; i++) {
    var sheet = spreadsheet.getSheetByName(possibleNames[i]);
    if (sheet) {
      return sheet;
    }
  }

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