/* Color changing on select for the day buttons: */
const dayBtn = document.querySelectorAll(".day-btn");

dayBtn.forEach(element => {
    element.addEventListener('click', () => {
        if (element.getAttribute("aria-pressed") == "false") {
            element.style.backgroundColor = "#457B9D";
        } else {
            element.style.backgroundColor = "#1d3557";
        }
        element.style.color = "#f1faee";
    });
});

/* Holds the images uploaded be the user */
var imageFile1;
var imageFile2;

function listenUpload() {
    var input1 = document.getElementById("medImg-1");
    var input2 = document.getElementById("medImg-2");

    input1.addEventListener('change', (e) => {
        console.log("file input1 change noticed.");
        imageFile1 = e.target.files[0];
    });

    input2.addEventListener('change', (e) => {
        console.log("file input2 change noticed.");
        imageFile2 = e.target.files[0];
    });
}

listenUpload();

// Reference to the collection
var colMedicationRef = db.collection('MedicationInfo');

// Event listener for form submission
document.getElementById('medicationForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    console.log("Form submitted"); // Debugging

    // Get form data
    const userID = firebase.auth().currentUser.uid;

    const name = document.getElementById('name').value;
    const type = document.getElementById('type').value;
    const time = document.getElementById('time').value;
    const desc = document.getElementById('desc').value;
    const repeat = document.getElementById('repeat').value;
    var scheduleType;

    //translates the buttons and stores the data accordingly
    // 0-6 == sun-sat
    var days = "";

    dayBtn.forEach(element => {
        if (element.getAttribute("aria-pressed") == "true") {
            if(days == "")
            days += element.value;
        else
            days += "-" + element.value;
        }        
    });
    // make the days selected populate an array:
    var daysArray = days.split('-');

    if (daysArray.length == 7) {
        scheduleType = "daily";
    } else {
        scheduleType = "select-days";
    }

    console.log("Form data:", name, type, days, time, desc, repeat); // Debugging

    // Adding medication entry
    colMedicationRef.add({
        user: userID,
        name: name,
        type: type,
        desc: desc,
        repeat: repeat,
        scheduleType: scheduleType,
    })
    .then(function(docRefMedication) {
        // adding the specific schedule in the scheduleInfo collection 
        if (scheduleType == "daily") {
            // adding a daily schedule
            colMedicationRef.doc(docRefMedication.id).collection('scheduleInfo').add({
                time: time,
                status: false
            }).then(() => {
                console.log("daily schedule added.");
            }).catch((e) => {
                console.error("Daily schedule cannot be added: ", e);
            });
        } else if (scheduleType == "select-days") {
            // adding each selected day as it's own doc
            for (let i = 0; i < daysArray.length; i++) {
                // day will be one of 0-6 which is sun-sat
                colMedicationRef.doc(docRefMedication.id).collection('scheduleInfo').add({
                    day: daysArray[i],
                    time: time,
                    staus: false
                }).then(() => {
                    console.log(i + "day is added in select-days schedule.");
                }).catch((e) => {
                    console.error("Select-days schedule cannot be added: ", e);
                });
            }
        } else {
            console.log("No schedule type is defined! Schedule doc not created!");
        }
        console.log("Medication entry written with ID: ", docRefMedication.id);
        //upload the image to Storage on Firebase
        uploadImage(docRefMedication.id);
        // Reset the form
        document.getElementById('medicationForm').reset();
        // reset the day selectors too.
    })
    .catch(function(error) {
        console.error("Error adding Medication entry: ", error);
    });
});

function uploadImage(docID) {
    if(imageFile1) {
        putAndUpdate(imageFile1, docID);
        console.log("Uploaded image1.");
    } 
    if(imageFile2) {
        putAndUpdate(imageFile2, docID);
        console.log("Uploaded image2.");
    }
}

/* Puts the image in the Storage (not Firebase database) and updates the MedicationInfo doc with the proper ID */
function putAndUpdate(img, docID) {
    var fireStorage = storage.ref("images/" + docID + ".jpg");

    fireStorage.put(img).then(() => {
        console.log("put images.");
        fireStorage.getDownloadURL().then((url) => {
            console.log("downloaded URL.");
            colMedicationRef.doc(docID).update({
                "image": url
            }).then(() => {
                console.log("updated firestore.");
            }).catch((e) => {
                console.error("Error updating medication doc with image URL: ", e);
            });
        });
    }).catch((error) => {
        console.error("Image upload failed: ", error);
    });
}