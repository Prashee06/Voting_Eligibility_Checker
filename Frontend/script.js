const SERVER_URL = "http://localhost:9091";


// ======================================================
// PAGE 1 - ELIGIBILITY CHECKER
// ======================================================

const eligibilityForm =
    document.getElementById("eligibilityForm");


if (eligibilityForm) {

    const country =
        document.getElementById("country");

    const otherCountryGroup =
        document.getElementById("otherCountryGroup");

    const otherCountry =
        document.getElementById("otherCountry");

    const result =
        document.getElementById("result");

    const resultIcon =
        document.getElementById("resultIcon");

    const resultTitle =
        document.getElementById("resultTitle");

    const resultMessage =
        document.getElementById("resultMessage");

    const resultDetails =
        document.getElementById("resultDetails");

    const continueButton =
        document.getElementById("continueButton");

    const checkButton =
        document.getElementById("checkButton");


    // --------------------------------------------------
    // OTHER COUNTRY
    // --------------------------------------------------

    country.addEventListener("change", function () {

        if (country.value === "Other") {

            otherCountryGroup.classList.remove("hidden");

            otherCountry.required = true;

        } else {

            otherCountryGroup.classList.add("hidden");

            otherCountry.required = false;

            otherCountry.value = "";
        }

    });


    // --------------------------------------------------
    // CHECK ELIGIBILITY
    // --------------------------------------------------

    eligibilityForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            checkButton.disabled = true;

            checkButton.textContent =
                "Checking...";


            result.classList.add("hidden");

            continueButton.classList.add("hidden");


            try {

                const name =
                    document.getElementById("name").value.trim();

                const dob =
                    document.getElementById("dob").value;

                let selectedCountry =
                    country.value;

                const citizenship =
                    document.getElementById("citizenship").value;


                const registeredElement =
                    document.querySelector(
                        'input[name="registered"]:checked'
                    );


                if (!registeredElement) {

                    throw new Error(
                        "Please select whether you are already registered as a voter."
                    );
                }


                const registered =
                    registeredElement.value;


                // Other country

                if (selectedCountry === "Other") {

                    selectedCountry =
                        otherCountry.value.trim();

                    if (!selectedCountry) {

                        throw new Error(
                            "Please enter your country name."
                        );
                    }
                }


                // Basic frontend validation

                if (!name) {

                    throw new Error(
                        "Please enter your full name."
                    );
                }


                if (!dob) {

                    throw new Error(
                        "Please select your date of birth."
                    );
                }


                if (!selectedCountry) {

                    throw new Error(
                        "Please select your country."
                    );
                }


                if (!citizenship) {

                    throw new Error(
                        "Please select your citizenship."
                    );
                }


                // --------------------------------------------------
                // SEND DATA TO JAVA SERVER
                // --------------------------------------------------

                const formData =
                    new URLSearchParams();


                formData.append(
                    "name",
                    name
                );

                formData.append(
                    "dob",
                    dob
                );

                formData.append(
                    "country",
                    selectedCountry
                );

                formData.append(
                    "citizenship",
                    citizenship
                );

                formData.append(
                    "registered",
                    registered
                );


                const response =
                    await fetch(
                        SERVER_URL + "/check",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/x-www-form-urlencoded"
                            },

                            body:
                                formData.toString()
                        }
                    );


                const data =
                    await response.json();


                // --------------------------------------------------
                // DISPLAY RESULT
                // --------------------------------------------------

                result.classList.remove("hidden");


                if (data.eligible === true) {

                    result.className =
                        "result success";


                    resultIcon.textContent =
                        "✅";


                    resultTitle.textContent =
                        "Eligible to Vote";


                    resultMessage.textContent =
                        "You meet the basic eligibility requirements to vote in India.";


                    resultDetails.innerHTML =

                        "<strong>Name:</strong> "
                        + escapeHtml(data.name)
                        + "<br>"

                        + "<strong>Age:</strong> "
                        + data.age
                        + "<br>"

                        + "<strong>Country:</strong> "
                        + escapeHtml(data.country)
                        + "<br>"

                        + "<strong>Citizenship:</strong> "
                        + escapeHtml(data.citizenship)
                        + "<br>"

                        + "<strong>Registered Voter:</strong> "
                        + escapeHtml(data.registered);


                    // Save data for Page 2

                    const eligibilityData = {

                        checkId:
                            data.checkId,

                        name:
                            data.name,

                        dob:
                            data.dob,

                        age:
                            data.age,

                        country:
                            data.country,

                        citizenship:
                            data.citizenship,

                        registered:
                            data.registered

                    };


                    sessionStorage.setItem(
                        "eligibilityData",
                        JSON.stringify(
                            eligibilityData
                        )
                    );


                    continueButton.classList.remove(
                        "hidden"
                    );


                    continueButton.onclick =
                        function () {

                            window.location.href =
                                "additional.html";

                        };


                } else {

                    result.className =
                        "result failure";


                    resultIcon.textContent =
                        "❌";


                    resultTitle.textContent =
                        "Not Eligible to Vote";


                    resultMessage.textContent =
                        data.reason ||
                        "You are not eligible to vote.";


                    resultDetails.innerHTML =

                        "<strong>Name:</strong> "
                        + escapeHtml(data.name || name)
                        + "<br>"

                        + "<strong>Age:</strong> "
                        + (data.age || "Not available")
                        + "<br>"

                        + "<strong>Country:</strong> "
                        + escapeHtml(
                            data.country || selectedCountry
                        )
                        + "<br>"

                        + "<strong>Citizenship:</strong> "
                        + escapeHtml(
                            data.citizenship || citizenship
                        )
                        + "<br>"

                        + "<strong>Reason:</strong> "
                        + escapeHtml(
                            data.reason ||
                            "Not eligible"
                        );

                }


            } catch (error) {

                result.className =
                    "result failure";

                result.classList.remove(
                    "hidden"
                );

                resultIcon.textContent =
                    "⚠️";

                resultTitle.textContent =
                    "Error";

                resultMessage.textContent =
                    error.message;


            } finally {

                checkButton.disabled = false;

                checkButton.textContent =
                    "Check Eligibility";
            }

        }
    );
}


// ======================================================
// PAGE 2 - ADDITIONAL DETAILS
// ======================================================

const additionalForm =
    document.getElementById("additionalForm");


if (additionalForm) {

    const savedData =
        sessionStorage.getItem(
            "eligibilityData"
        );


    // --------------------------------------------------
    // CHECK WHETHER PAGE 1 WAS COMPLETED
    // --------------------------------------------------

    if (!savedData) {

        alert(
            "Please complete the eligibility check first."
        );

        window.location.href =
            "index.html";

    } else {

        const data =
            JSON.parse(savedData);


        // --------------------------------------------------
        // DISPLAY PAGE 1 DATA
        // --------------------------------------------------

        document.getElementById(
            "fullName"
        ).value =
            data.name || "";


        document.getElementById(
            "dateOfBirth"
        ).value =
            data.dob || "";


        document.getElementById(
            "age"
        ).value =
            data.age || "";


        document.getElementById(
            "additionalCitizenship"
        ).value =
            data.citizenship || "";


        document.getElementById(
            "alreadyVoter"
        ).value =
            data.registered || "No";


        // --------------------------------------------------
        // VOTER ID FIELD
        // --------------------------------------------------

        const voterIdGroup =
            document.getElementById(
                "voterIdGroup"
            );


        const voterId =
            document.getElementById(
                "voterId"
            );


        if (
            data.registered &&
            data.registered.toLowerCase() ===
            "yes"
        ) {

            voterIdGroup.classList.remove(
                "hidden"
            );

            voterId.required = true;

        } else {

            voterIdGroup.classList.add(
                "hidden"
            );

            voterId.required = false;
        }


        // --------------------------------------------------
        // SAVE ADDITIONAL DETAILS
        // --------------------------------------------------

        additionalForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const saveButton =
                    document.getElementById(
                        "saveButton"
                    );


                const saveResult =
                    document.getElementById(
                        "saveResult"
                    );


                const saveIcon =
                    document.getElementById(
                        "saveIcon"
                    );


                const saveTitle =
                    document.getElementById(
                        "saveTitle"
                    );


                const saveMessage =
                    document.getElementById(
                        "saveMessage"
                    );


                const savedDetails =
                    document.getElementById(
                        "savedDetails"
                    );


                try {

                    saveButton.disabled =
                        true;

                    saveButton.textContent =
                        "Saving...";


                    const phone =
                        document.getElementById(
                            "phone"
                        ).value.trim();


                    const gender =
                        document.getElementById(
                            "gender"
                        ).value;


                    const state =
                        document.getElementById(
                            "state"
                        ).value.trim();


                    const district =
                        document.getElementById(
                            "district"
                        ).value.trim();


                    const city =
                        document.getElementById(
                            "city"
                        ).value.trim();


                    const address =
                        document.getElementById(
                            "address"
                        ).value.trim();


                    const pincode =
                        document.getElementById(
                            "pincode"
                        ).value.trim();


                    const aadhaar =
                        document.getElementById(
                            "aadhaar"
                        ).value.trim();


                    const voterIdValue =
                        voterId.value.trim();


                    // --------------------------------------------------
                    // VALIDATION
                    // --------------------------------------------------

                    if (!gender) {

                        throw new Error(
                            "Please select your gender."
                        );
                    }


                    if (!/^[6-9][0-9]{9}$/.test(phone)) {

                        throw new Error(
                            "Please enter a valid 10-digit Indian mobile number."
                        );
                    }


                    if (!state) {

                        throw new Error(
                            "Please enter your state."
                        );
                    }


                    if (!district) {

                        throw new Error(
                            "Please enter your district."
                        );
                    }


                    if (!city) {

                        throw new Error(
                            "Please enter your city."
                        );
                    }


                    if (!address) {

                        throw new Error(
                            "Please enter your address."
                        );
                    }


                    if (!/^[0-9]{6}$/.test(pincode)) {

                        throw new Error(
                            "Pincode must contain exactly 6 digits."
                        );
                    }


                    if (!/^[0-9]{12}$/.test(aadhaar)) {

                        throw new Error(
                            "Aadhaar number must contain exactly 12 digits."
                        );
                    }


                    if (
                        data.registered === "Yes" &&
                        !voterIdValue
                    ) {

                        throw new Error(
                            "Please enter your Voter ID number."
                        );
                    }


                    // --------------------------------------------------
                    // SEND TO JAVA SERVER
                    // --------------------------------------------------

                    const formData =
                        new URLSearchParams();


                    formData.append(
                        "checkId",
                        data.checkId
                    );


                    formData.append(
                        "name",
                        data.name
                    );


                    formData.append(
                        "dob",
                        data.dob
                    );


                    formData.append(
                        "age",
                        data.age
                    );


                    formData.append(
                        "gender",
                        gender
                    );


                    formData.append(
                        "phone",
                        phone
                    );


                    formData.append(
                        "citizenship",
                        data.citizenship
                    );


                    formData.append(
                        "state",
                        state
                    );


                    formData.append(
                        "district",
                        district
                    );


                    formData.append(
                        "city",
                        city
                    );


                    formData.append(
                        "address",
                        address
                    );


                    formData.append(
                        "pincode",
                        pincode
                    );


                    formData.append(
                        "aadhaar",
                        aadhaar
                    );


                    formData.append(
                        "registered",
                        data.registered
                    );


                    formData.append(
                        "voterId",
                        voterIdValue
                    );


                    const response =
                        await fetch(
                            SERVER_URL +
                            "/saveEligible",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/x-www-form-urlencoded"
                                },

                                body:
                                    formData.toString()
                            }
                        );


                    const responseData =
                        await response.json();


                    saveResult.classList.remove(
                        "hidden"
                    );


                    if (responseData.success) {

                        saveResult.className =
                            "result success";


                        saveIcon.textContent =
                            "✅";


                        saveTitle.textContent =
                            "Details Saved Successfully";


                        saveMessage.textContent =
                            "Your additional voter details have been stored successfully.";


                        savedDetails.innerHTML =

                            "<strong>Name:</strong> "
                            + escapeHtml(data.name)
                            + "<br>"

                            + "<strong>Age:</strong> "
                            + data.age
                            + "<br>"

                            + "<strong>Gender:</strong> "
                            + escapeHtml(gender)
                            + "<br>"

                            + "<strong>Phone:</strong> "
                            + escapeHtml(phone)
                            + "<br>"

                            + "<strong>State:</strong> "
                            + escapeHtml(state)
                            + "<br>"

                            + "<strong>District:</strong> "
                            + escapeHtml(district)
                            + "<br>"

                            + "<strong>City:</strong> "
                            + escapeHtml(city);


                        saveButton.textContent =
                            "Details Saved";


                        saveButton.disabled =
                            true;


                        // Remove temporary browser data

                        sessionStorage.removeItem(
                            "eligibilityData"
                        );


                    } else {

                        throw new Error(
                            responseData.message ||
                            "Unable to save details."
                        );
                    }


                } catch (error) {

                    saveResult.className =
                        "result failure";


                    saveResult.classList.remove(
                        "hidden"
                    );


                    saveIcon.textContent =
                        "❌";


                    saveTitle.textContent =
                        "Unable to Save";


                    saveMessage.textContent =
                        error.message;


                    saveButton.disabled =
                        false;


                    saveButton.textContent =
                        "Save Details";
                }

            }
        );
    }
}


// ======================================================
// HTML ESCAPE FUNCTION
// ======================================================

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }


    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}