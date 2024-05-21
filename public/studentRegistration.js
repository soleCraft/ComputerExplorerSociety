document.addEventListener("DOMContentLoaded", function() {
    const registrationPopup = document.getElementById("registrationPopup");
    const closeBtn = document.getElementById("closeBtn");

    if (performance.navigation.type === 1) {
        window.location.href = "index.html";
    }

    function closePopup() {
        registrationPopup.style.display = "none";
        window.location.href = "index.html"; 
    }

    closeBtn.addEventListener("click", function() {
        closePopup(); 
    });
});
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, set, onValue} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbPjQqY5T2tWqXeDx_CJNB55DqC_9rFe8",
  authDomain: "receiptdb-2ee46.firebaseapp.com",
  databaseURL: "https://receiptdb-2ee46-default-rtdb.firebaseio.com",
  projectId: "receiptdb-2ee46",
  storageBucket: "receiptdb-2ee46.appspot.com",
  messagingSenderId: "1081206126953",
  appId: "1:1081206126953:web:31fc48507e771fb8d0e5f8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase();

function checkStudentRegistration(studentNumber) {
    const registeredStudentsRef = ref(db, "Registered Students");
    return new Promise((resolve, reject) => {
        onValue(registeredStudentsRef, (snapshot) => {
            const registeredStudents = snapshot.val();
            if (registeredStudents && registeredStudents[studentNumber]) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

var studentNo, fullName, section, email;

function initializeFormElements() {
    studentNo = document.getElementById("studentNumber");
    fullName = document.getElementById("fullName");
    section = document.getElementById("section");
    email = document.getElementById("email");
}
initializeFormElements()

function insertNewStudent() {
    const now = new Date();
    const utcOffset = 8;
    const localTime = new Date(now.getTime() + (utcOffset * 60 * 60 * 1000));
    const timestamp = localTime.toISOString();

    const trimmedStudentNo = studentNo.value.trim();
    const trimmedFullName = fullName.value.trim();
    const trimmedSection = section.value.trim();
    const trimmedEmail = email.value.trim();

    set(ref(db, "Registered Students/" + trimmedStudentNo), {
        FullName: trimmedFullName,
        Section: trimmedSection,
        Email: trimmedEmail,
        Timestamp: timestamp
    })
    .then(() => {
        alert("Registration successful! You're all set to make payments now.");
    })
    .catch((error) => {
        alert("Unsuccessful, error " + error);
    });
}
document.getElementById("registrationForm").addEventListener("submit", function(event) {
    event.preventDefault();
    if (!validateForm()) {
        alert("Please fill in all required fields.");
        return;
    }

    document.getElementById("verifyStudentNo").innerText = document.getElementById("studentNumber").value;
    document.getElementById("verifyFullName").innerText = document.getElementById("fullName").value;
    document.getElementById("verifySection").innerText = document.getElementById("section").value;
    document.getElementById("verifyEmail").innerText = document.getElementById("email").value;

    document.getElementById("verifyPopup").style.visibility = "visible";
});

document.getElementById("confirmSubmitButton").addEventListener("click", function() {
    if (!validateForm()) {
        alert("Please fill in all required fields.");
        return;
    }

    const studentNumber = document.getElementById("studentNumber").value;

    checkStudentRegistration(studentNumber)
        .then((isRegistered) => {
            if (isRegistered) {
                alert("The student is already registered.");
            } else {
                insertNewStudent();
                document.getElementById("verifyPopup").style.visibility = "hidden";
                document.getElementById("registrationForm").reset();
            }
        })
        .catch((error) => {
            console.error("Error checking student registration:", error);
            alert("An error occurred while checking student registration.");
        });
});


document.getElementById("cancelSubmitButton").addEventListener("click", function() {
    document.getElementById("verifyPopup").style.visibility = "hidden";
    document.getElementById("registrationPopup").style.display = "block"; 
});


function validateForm() {
    const studentNumber = document.getElementById("studentNumber").value.trim();
    const fullName = document.getElementById("fullName").value.trim();
    const section = document.getElementById("section").value.trim();
    const email = document.getElementById("email").value.trim();

    return studentNumber !== '' && fullName !== '' && section !== '' && email !== '';
}