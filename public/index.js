// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, get, ref, set, onValue, update} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCbPjQqY5T2tWqXeDx_CJNB55DqC_9rFe8",
    authDomain: "receiptdb-2ee46.firebaseapp.com",
    projectId: "receiptdb-2ee46",
    storageBucket: "receiptdb-2ee46.appspot.com",
    messagingSenderId: "1081206126953",
    appId: "1:1081206126953:web:31fc48507e771fb8d0e5f8"
};

// Initialize Firebase
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
async function getTeacherFullName(teacherID) {
    try {
        const teacherFullNameRef = ref(db, `Registered Teacher/${teacherID}/FullName`);
        const teacherSnapshot = await get(teacherFullNameRef);
        return teacherSnapshot.val();
    } catch (error) {
        console.error("Error fetching teacher's full name:", error);
        throw error;
    }
}


function populateOptions() {
    const teachersOptions = document.getElementById('teacherOptions');

    const teachersRef = ref(db, "Teacher's Form");
    onValue(teachersRef, async (snapshot) => {
        const data = snapshot.val();
        for (const teacherID in data) {
            try {
                const teacherFullName = await getTeacherFullName(teacherID);
                const option = document.createElement('option');
                option.value = teacherID; 
                option.textContent = teacherFullName; 
                teachersOptions.appendChild(option);
            } catch (error) {
                //Bahala na kung maglalagay pa
            }
        }
    });
}



function fetchAndCheckEvents(selectedTeacher) {
    return new Promise((resolve, reject) => {
        const currentDateTime = new Date();
        const eventsRef = ref(db, "Teacher's Form/" + selectedTeacher + "/Events");
        onValue(eventsRef, (snapshot) => {
            const events = snapshot.val();
            let hasActiveEvents = false;
            if (events) {
                for (const eventName in events) {
                    const eventData = events[eventName];
                    const startDateTime = new Date(eventData.StartDateTime);
                    const endDateTime = new Date(eventData.EndDateTime);
                    if (currentDateTime >= startDateTime && currentDateTime <= endDateTime) {
                        hasActiveEvents = true;
                        break; 
                    }
                }
            }
            resolve(hasActiveEvents);
        });
    });
}

async function hideTeacherNamesWithoutActiveEvents() {
    const teacherOptions = document.getElementById('teacherOptions');
    const currentDateTime = new Date();

    for (const option of teacherOptions.querySelectorAll('option')) {
        const selectedTeacher = option.value;
        const hasActiveEvents = await fetchAndCheckEvents(selectedTeacher);
        if (!hasActiveEvents) {
            option.style.display = 'none';
        } else {
            option.style.display = 'block';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Fetch teacher data first
    const teachersRef = ref(db, "Teacher's Form");
    onValue(teachersRef, (snapshot) => {
        populateOptions();
        hideTeacherNamesWithoutActiveEvents();
    });
});



document.getElementById('teacherOptions').addEventListener('change', () => {
    const selectedTeacher = document.getElementById('teacherOptions').value;
    const eventOptions = document.getElementById('eventOptions');

    eventOptions.innerHTML = '';

    const currentDateTime = new Date(); 

    const eventsRef = ref(db, "Teacher's Form/" + selectedTeacher + "/Events");
    onValue(eventsRef, (snapshot) => {
        const events = snapshot.val();
        if (events) {
            for (const eventName in events) {
                const eventData = events[eventName];
                const startDateTime = new Date(eventData.StartDateTime);
                const endDateTime = new Date(eventData.EndDateTime);
                if (currentDateTime >= startDateTime && currentDateTime <= endDateTime) {
                    const option = document.createElement('option');
                    option.value = eventName;
                    option.textContent = `${eventName} (${eventData.Amount} PHP) - ${calculateDaysAndTimeLeft(eventData.StartDateTime, eventData.EndDateTime)}`;
                    eventOptions.appendChild(option);
                }
            }
        }
    });
});



function calculateDaysAndTimeLeft(startDateTime, endDateTime) {
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    const philippinesTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"});
    const currentDateTime = new Date(philippinesTime);

    if (currentDateTime < startDate) {
        return null;
    }

    const difference = endDate.getTime() - currentDateTime.getTime();
    const daysLeft = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    if (daysLeft === 0) {
        if (hoursLeft === 0) {
            return `${minutesLeft} minutes left`;
        } else {
            return `${hoursLeft} hours ${minutesLeft} minutes left`;
        }
    } else {
        return `${daysLeft} days ${hoursLeft} hours left`;
    }
}


var studentNo, teacher, event, paymentMet, paymentApp, referenceNumber;

function initializeFormElements() {
    studentNo = document.getElementById("studentNoInput");
    teacher = document.getElementById("teacherOptions");
    event = document.getElementById("eventOptions");
    paymentMet = document.getElementById("paymentOptions");
    paymentApp = document.getElementById("appOptions");
    referenceNumber = document.getElementById("referenceNumber");
}


const paymentOptions = document.getElementById("paymentOptions");
if (paymentOptions) {
    paymentOptions.addEventListener("change", toggleReferenceNumber);
}


async function insertNewReceipt() {
    try {
        const timestamp = getLocalTimestamp();
        const teacherPath = "Student Receipts/" + await getTeacherFullName(teacher.value);
        const selectedEvent = event.value;
        const eventPath = teacherPath + "/Events/" + event.value;
        const studentPath = eventPath + "/" + studentNo.value;

        await checkIfTeacherAndEventExist(teacherPath, eventPath, studentPath, timestamp, selectedEvent);
    } catch (error) {
        console.error("Error inserting new receipt:", error);
        throw error;
    }
}

function getLocalTimestamp() {
    const now = new Date();
    const utcOffset = 8;
    const localTime = new Date(now.getTime() + (utcOffset * 60 * 60 * 1000));
    return localTime.toISOString();
}

function checkIfTeacherAndEventExist(teacherPath, eventPath, studentPath, timestamp, selectedEvent) {
    const teacherRef = ref(db, teacherPath);
    const eventRef = ref(db, eventPath);

    Promise.all([
        get(teacherRef),
        get(eventRef)
    ]).then(([teacherSnapshot, eventSnapshot]) => {
        if (!teacherSnapshot.exists() || !eventSnapshot.exists()) {
            createTeacherAndEvent(teacherPath, eventPath, studentPath, timestamp, selectedEvent);
        } else {
            checkIfStudentExists(studentPath, timestamp, selectedEvent);
        }
    }).catch((error) => {
        alert("Unsuccessful, error: " + error);
    });
}

function createTeacherAndEvent(teacherPath, eventPath, studentPath, timestamp, selectedEvent) {
    const teacherRef = ref(db, teacherPath);
    const eventRef = ref(db, eventPath);

    Promise.all([
        update(teacherRef, {}),
        update(eventRef, {}) 
    ]).then(() => {
        insertStudentData(studentPath, timestamp, selectedEvent);
    }).catch((error) => {
        alert("Unsuccessful, error: " + error);
    });
}
function checkIfStudentExists(studentPath, timestamp, selectedEvent) {
    const studentRef = ref(db, studentPath);
    get(studentRef).then((studentSnapshot) => {
        if (studentSnapshot.exists()) {
            alert(`You have already made a payment for the event: ${selectedEvent}.`);
            document.getElementById("receipt-form-wrapper").reset();
            window.location.href = "index.html";
        } else {
            insertStudentData(studentPath, timestamp, selectedEvent);
        }
    }).catch((error) => {
        alert("Unsuccessful, error: " + error);
    });
}
function getEventAmount(selectedEventName) {
    const selectedTeacher = document.getElementById('teacherOptions').value;
    const amountRef = ref(db, `Teacher's Form/${selectedTeacher}/Events/${selectedEventName}/Amount`);

    return get(amountRef)
        .then((amountSnapshot) => {
            const amountData = amountSnapshot.val();
            return amountData;
        })
        .catch((error) => {
            throw error;
        });
}
function getStudentDetails(studentNumber) {
    const studentRef = ref(db, `Registered Students/${studentNumber}`);
    
    return get(studentRef)
        .then((studentSnapshot) => {
            const studentData = studentSnapshot.val();
            if (studentData) {
                const fullName = studentData.FullName;
                const section = studentData.Section;
                return { fullName, section };
            } else {
                throw new Error('Student data not found');
            }
        })
        .catch((error) => {
            throw error;
        });
}

async function insertStudentData(studentPath, timestamp, selectedEventName) {
    if (!selectedEventName) {
        alert("Error: Selected event name is undefined.");
        return;
    }

    try {
        const teacherFullName = await getTeacherFullName(document.getElementById("teacherOptions").value.trim());

        const studentDetails = await getStudentDetails(document.getElementById("studentNoInput").value);
        const { fullName, section } = studentDetails;

        const amountData = await getEventAmount(selectedEventName);
        const eventData = {
            STDNumber: document.getElementById("studentNoInput").value.trim(),
            FullName: fullName.trim(),
            Section: section.trim(),
            Teacher: teacherFullName.trim(),
            Event: selectedEventName.trim(),
            Amount: amountData.trim(),
            PaymentMethod: document.getElementById("paymentOptions").value.trim(),
            PaymentApp: document.getElementById("paymentOptions").value === "Cash" ? "Cash Payment" : document.getElementById("appOptions").value.trim(),
            ReferenceNumber: document.getElementById("referenceNumber").value.trim(),
            Timestamp: timestamp.trim()
        };

        await set(ref(db, studentPath), eventData);
        alert("New Data Stored Successfully!");
        await generateQRCode();
        document.getElementById("qrPopup").style.display = "block";

        // Fetch student email and send email with QR code
        const studentEmail = await getStudentEmail(document.getElementById("studentNoInput").value);
        if (studentEmail) {
            const qrCodeUrl = document.getElementById("qrImage").src;
            await sendEmailWithQRCode(studentEmail, qrCodeUrl, fullName, selectedEventName);
        } else {
            console.error("Student email not found");
        }

    } catch (error) {
        alert("Error inserting student data: " + error);
    }
}

async function sendEmailWithQRCode(email, qrCodeUrl, fullName, selectedEventName) {
    const subject = "Your QR Code";
    const text = `Good Day! ${fullName},

        This is an automated message to confirm that your data submission for the event ${selectedEventName} has been successfully received.
Attached to this email is a unique QR code that serves as your receipt for the submitted data. Please keep this QR code for your records.
Thank you for your participation. Should you have any questions or concerns, feel free to contact us on our email (solecraft577@gmail.com)`;

    try {
        const response = await fetch('http://localhost:3000/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, subject, text, qrCodeUrl })
        });

        const result = await response.json();
        if (response.ok) {
            console.log('Email sent successfully:', result);
        } else {
            console.error('Error sending email:', result);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function getStudentEmail(studentNumber) {
    const studentRef = ref(db, `Registered Students/${studentNumber}/Email`);
    const snapshot = await get(studentRef);
    return snapshot.val();
}

function validateForm() {
    return document.getElementById("teacherOptions").value.trim() !== '' &&
        document.getElementById("eventOptions").value.trim() !== '' &&
        document.getElementById("studentNoInput").value.trim() !== '' &&
        document.getElementById("paymentOptions").value.trim() !== '' &&
        (document.getElementById("paymentOptions").value === "Cash" ? true : document.getElementById("appOptions").value.trim() !== '') &&
        document.getElementById("referenceNumber").value.trim() !== '';
}

let qrPopup = document.getElementById("qrPopup");
let qrImage = document.getElementById("qrImage");

function encodeData(data) {
    const mapping = {
        'a': 'x', 'b': 'y', 'c': 'z', 'd': 'a', 'e': 'b',
        'f': 'c', 'g': 'd', 'h': 'e', 'i': 'f', 'j': 'g',
        'k': 'h', 'l': 'i', 'm': 'j', 'n': 'k', 'o': 'l',
        'p': 'm', 'q': 'n', 'r': 'o', 's': 'p', 't': 'q',
        'u': 'r', 'v': 's', 'w': 't', 'x': 'u', 'y': 'v',
        'z': 'w', 'A': 'X', 'B': 'Y', 'C': 'Z', 'D': 'A',
        'E': 'B', 'F': 'C', 'G': 'D', 'H': 'E', 'I': 'F',
        'J': 'G', 'K': 'H', 'L': 'I', 'M': 'J', 'N': 'K',
        'O': 'L', 'P': 'M', 'Q': 'N', 'R': 'O', 'S': 'P',
        'T': 'Q', 'U': 'R', 'V': 'S', 'W': 'T', 'X': 'U',
        'Y': 'V', 'Z': 'W', '0': '9', '1': '8', '2': '7',
        '3': '6', '4': '5', '5': '4', '6': '3', '7': '2',
        '8': '1', '9': '0'
    };

    let encodedData = '';
    for (let i = 0; i < data.length; i++) {
        let char = data[i];
        encodedData += mapping[char] || char;
    }
    return encodedData;
}

async function generateQRCode() {
    let studentNo = document.getElementById("studentNoInput").value;
    let teacherName = await getTeacherFullName(document.getElementById("teacherOptions").value);
    let selectedEvent = document.getElementById("eventOptions").value;
    let amount = await getEventAmount(selectedEvent);
    let paymentMethod = document.getElementById("paymentOptions").value;
    let paymentApp = paymentMethod === "Cash" ? "Cash Payment" : document.getElementById("appOptions").value;
    let referenceNumber = document.getElementById("referenceNumber").value;

    let studentDetails;
    try {
        studentDetails = await getStudentDetails(studentNo);
    } catch (error) {
        console.error("Error fetching student details:", error);
        alert("An error occurred while fetching student details.");
        return;
    }

    let studentData = `${studentNo},${studentDetails.fullName},${studentDetails.section},${teacherName},${selectedEvent},${amount},${paymentMethod},${paymentApp},${referenceNumber}`;

    let uniqueKey = "Hello123";
    let dataWithUniqueKey = `${studentData},${uniqueKey}`;

    if (studentData.length > 0) {
        let encodedData = encodeData(dataWithUniqueKey);
        document.getElementById("eventNamePlaceholder").textContent = selectedEvent;

        // Change: Increase the size of the QR code to 300x300
        let qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}`;
        qrImage.src = qrCodeUrl;
        qrPopup.classList.add("show-img");
    } else {
        alert("Please fill in all required fields.");
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const studentIDVerifyPopup = document.getElementById("studentIDVerifyPopup");
    const closeBtn = document.querySelector(".close-studNo-icon");

    function closePopup() {
        studentIDVerifyPopup.style.display = "none";
    }

    closeBtn.addEventListener("click", function() {
        closePopup(); 
    });

    document.getElementById("paymentButton").addEventListener("click", function() {

        document.getElementById("studentIDVerifyPopup").style.display = "block";
    });
    initializeFormElements();
    const paymentOptions = document.getElementById("paymentOptions");
    if (paymentOptions) {
        paymentOptions.addEventListener("change", toggleReferenceNumber);
    }
    document.getElementById("searchButton").addEventListener("click", async function() {
        const studentNumber = document.getElementById("studentNoInput").value;
        const isRegistered = await checkStudentRegistration(studentNumber);
        if (isRegistered) { 
            document.getElementById("studentIDVerifyPopup").style.display = "none";
            document.getElementById("overlay").style.visibility = "visible";
        } else {
            alert("Oops! It seems you haven't registered yet. Click the registration button to start the registration process.");
            document.getElementById("studentNoInput").value = "";
        }
    });
});

document.getElementById("closeBtnReceiptForm").addEventListener("click", function() {
    window.location.href = "index.html";
});


document.getElementById("submitButton").addEventListener("click", async function(event) {
    event.preventDefault();
    if (!validateForm()) {
        alert("Please fill in all required fields.");
        return;
    }
    const selectedEvent = document.getElementById("eventOptions").value;

    try {
        const studentDetails = await getStudentDetails(studentNo.value);
        document.getElementById("verifyStudentNo").innerText = studentNo.value;
        document.getElementById("verifyFullName").innerText = studentDetails.fullName;
        document.getElementById("verifySection").innerText = studentDetails.section;

        document.getElementById("verifyPaymentMethod").innerText = paymentMet.value;
        document.getElementById("verifyReferenceNumber").innerText = referenceNumber.value;
        
        const teacherFullName = await getTeacherFullName(teacher.value);
        document.getElementById("verifyTeacher").innerText = teacherFullName;
        
        document.getElementById("verifyEvents").innerText = selectedEvent;
        document.getElementById("verifyPaymentApp").innerText = paymentMet.value === "Cash" ? "Cash Payment" : paymentApp.value;

        const amountValue = await getEventAmount(selectedEvent);
        document.getElementById("verifyAmount").innerText = amountValue;

        document.getElementById("verifyPopup").style.visibility = "visible";
        document.getElementById("receipt-form-wrapper").style.visibility = "hidden";
    } catch (error) {
        console.error("Error processing form submission:", error);
        alert("An error occurred while processing your submission.");
    }
});


document.getElementById("confirmSubmitButton").addEventListener("click", function() {
    if (!validateForm()) {
        alert("Please fill in all required fields.");
        return;
    }
    insertNewReceipt();
    document.getElementById("receipt-form-wrapper").style.visibility = "hidden";
    document.getElementById("verifyPopup").style.visibility = "hidden";
});

document.getElementById("cancelSubmitButton").addEventListener("click", function() {
    document.getElementById("verifyPopup").style.visibility = "hidden";
    document.getElementById("receipt-form-wrapper").style.visibility = "visible";
});

document.getElementById("doneButton").addEventListener("click", function() {
    document.getElementById("verifyPopup").style.visibility = "hidden";
    document.getElementById("qrPopup").style.display = "none";
    document.getElementById("receipt-form-wrapper").reset();
    window.location.href = "index.html";

});