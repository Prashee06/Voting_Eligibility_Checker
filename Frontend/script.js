// ============================================================
// VOTING ELIGIBILITY CHECKER - script.js
// ============================================================

// Java backend URL
const SERVER_URL = "http://localhost:9091";


// ============================================================
// PAGE 1 - ELIGIBILITY CHECK
// ============================================================

const eligibilityForm = document.getElementById("eligibilityForm");

const countrySelect = document.getElementById("country");
const otherCountryGroup = document.getElementById("otherCountryGroup");
const otherCountryInput = document.getElementById("otherCountry");

const result = document.getElementById("result");
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const resultDetails = document.getElementById("resultDetails");

const continueButton = document.getElementById("continueButton");
const checkButton = document.getElementById("checkButton");


// ============================================================
// SHOW / HIDE "OTHER COUNTRY"
// ============================================================

if (countrySelect) {

    countrySelect.addEventListener("change", function () {

        if (countrySelect.value === "Other") {

            otherCountryGroup.classList.remove("hidden");

            otherCountryInput.required = true;

        } else {

            otherCountryGroup.classList.add("hidden");

            otherCountryInput.required = false;

            otherCountryInput.value = "";
        }
    });
}


// ============================================================
// ELIGIBILITY FORM SUBMIT
// ============================================================

if (eligibilityForm) {

    eligibilityForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        // --------------------------------------------------------
        // Get form values
        // --------------------------------------------------------

        const name =
            document.getElementById("name").value.trim();

        const dob =
            document.getElementById("dob").value;

        const selectedCountry =
            countrySelect.value;

        const citizenship =
            document.getElementById("citizenship").value;

        const registeredElement =
            document.querySelector(
                'input[name="registered"]:checked'
            );


        // --------------------------------------------------------
        // Check registered voter selection
        // --------------------------------------------------------

        if (!registeredElement) {

            alert("Please select whether you are already registered as a voter.");

            return;
        }


        const registered =
            registeredElement.value;


        // --------------------------------------------------------
        // Determine country
        // --------------------------------------------------------

        let country = selectedCountry;


        if (selectedCountry === "Other") {

            country =
                otherCountryInput.value.trim();

            if (!country) {

                alert("Please enter your country name.");

                otherCountryInput.focus();

                return;
            }
        }


        // --------------------------------------------------------
        // Basic validation
        // --------------------------------------------------------

        if (!name) {

            alert("Please enter your full name.");

            document.getElementById("name").focus();

            return;
        }


        if (!dob) {

            alert("Please select your date of birth.");

            document.getElementById("dob").focus();

            return;
        }


        if (!country) {

            alert("Please select your country.");

            countrySelect.focus();

            return;
        }


        if (!citizenship) {

            alert("Please select your citizenship.");

            document.getElementById("citizenship").focus();

            return;
        }


        // --------------------------------------------------------
        // Check that DOB is not in the future
        // --------------------------------------------------------

        const birthDate =
            new Date(dob);

        const today =
            new Date();

        today.setHours(0, 0, 0, 0);

        if (birthDate > today) {

            alert("Date of birth cannot be in the future.");

            return;
        }


        // --------------------------------------------------------
        // Disable button while checking
        // --------------------------------------------------------

        checkButton.disabled = true;

        checkButton.textContent = "Checking...";


        // Hide previous result
        result.classList.add("hidden");

        continueButton.classList.add("hidden");


        try {

            // ----------------------------------------------------
            // Create request data
            // ----------------------------------------------------

            const formData =
                new URLSearchParams();

            formData.append("name", name);
            formData.append("dob", dob);
            formData.append("country", country);
            formData.append("citizenship", citizenship);
            formData.append("registered", registered);


            // ----------------------------------------------------
            // Send request to Java backend
            // ----------------------------------------------------

            const response =
                await fetch(
                    SERVER_URL + "/check",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        },

                        body: formData.toString()
                    }
                );


            // ----------------------------------------------------
            // Convert response to JSON
            // ----------------------------------------------------

            const data =
                await response.json();


            console.log("Java server response:", data);


            // ====================================================
            // IMPORTANT ERROR CHECK
            // ====================================================

            /*
             * Java sends:
             *
             * {
             *   success: false,
             *   message: "..."
             * }
             *
             * when there is a server/database error.
             *
             * Previously this was being treated as
             * "Not eligible".
             */

            if (!response.ok || data.success === false) {

                throw new Error(
                    data.message ||
                    "The Java server returned an error."
                );
            }


            // ====================================================
            // DISPLAY RESULT
            // ====================================================

            result.classList.remove("hidden");


            // ====================================================
            // ELIGIBLE
            // ====================================================

            if (data.eligible === true) {

                resultIcon.textContent = "✅";

                resultTitle.textContent =
                    "Eligible to Vote";

                resultMessage.textContent =
                    data.reason ||
                    "You are eligible to vote in India.";


                resultDetails.innerHTML = `

                    <p>
                        <strong>Name:</strong>
                        ${escapeHtml(data.name || name)}
                    </p>

                    <p>
                        <strong>Age:</strong>
                        ${data.age ?? "Not available"}
                    </p>

                    <p>
                        <strong>Country:</strong>
                        ${escapeHtml(data.country || country)}
                    </p>

                    <p>
                        <strong>Citizenship:</strong>
                        ${escapeHtml(
                            data.citizenship ||
                            citizenship
                        )}
                    </p>

                    <p>
                        <strong>Registered Voter:</strong>
                        ${escapeHtml(
                            data.registered ||
                            registered
                        )}
                    </p>

                    <p>
                        <strong>Reason:</strong>
                        ${escapeHtml(
                            data.reason ||
                            "Eligible to vote."
                        )}
                    </p>

                `;


                // ------------------------------------------------
                // Save eligibility data
                // ------------------------------------------------

                const eligibilityData = {

                    checkId:
                        data.checkId,

                    name:
                        data.name || name,

                    dob:
                        data.dob || dob,

                    age:
                        data.age,

                    country:
                        data.country || country,

                    citizenship:
                        data.citizenship || citizenship,

                    registered:
                        data.registered || registered,

                    eligible:
                        true,

                    reason:
                        data.reason || ""

                };


                sessionStorage.setItem(
                    "eligibilityData",
                    JSON.stringify(eligibilityData)
                );


                // ------------------------------------------------
                // Show Continue button
                // ------------------------------------------------

                continueButton.classList.remove("hidden");

            }


            // ====================================================
            // NOT ELIGIBLE
            // ====================================================

            else {

                resultIcon.textContent = "❌";

                resultTitle.textContent =
                    "Not Eligible to Vote";

                resultMessage.textContent =
                    data.reason ||
                    "You are not eligible to vote.";


                resultDetails.innerHTML = `

                    <p>
                        <strong>Name:</strong>
                        ${escapeHtml(data.name || name)}
                    </p>

                    <p>
                        <strong>Age:</strong>
                        ${data.age ?? "Not available"}
                    </p>

                    <p>
                        <strong>Country:</strong>
                        ${escapeHtml(
                            data.country || country
                        )}
                    </p>

                    <p>
                        <strong>Citizenship:</strong>
                        ${escapeHtml(
                            data.citizenship ||
                            citizenship
                        )}
                    </p>

                    <p>
                        <strong>Registered Voter:</strong>
                        ${escapeHtml(
                            data.registered ||
                            registered
                        )}
                    </p>

                    <p>
                        <strong>Reason:</strong>
                        ${escapeHtml(
                            data.reason ||
                            "Not eligible."
                        )}
                    </p>

                `;


                // Make sure Continue is hidden
                continueButton.classList.add("hidden");


                // Remove old eligibility data
                sessionStorage.removeItem(
                    "eligibilityData"
                );
            }

        }


        // ========================================================
        // ERROR HANDLING
        // ========================================================

        catch (error) {

            console.error(
                "Eligibility check error:",
                error
            );


            result.classList.remove("hidden");

            resultIcon.textContent = "⚠️";

            resultTitle.textContent =
                "Server Error";

            resultMessage.textContent =
                error.message ||
                "Unable to connect to the Java server.";


            resultDetails.innerHTML = `

                <p>
                    <strong>Status:</strong>
                    The eligibility check could not be completed.
                </p>

                <p>
                    Please make sure the Java server is running on
                    port 9091.
                </p>

            `;


            continueButton.classList.add("hidden");
        }


        // --------------------------------------------------------
        // Enable button again
        // --------------------------------------------------------

        checkButton.disabled = false;

        checkButton.textContent =
            "Check Eligibility";

    });
}


// ============================================================
// CONTINUE TO ADDITIONAL DETAILS
// ============================================================

if (continueButton) {

    continueButton.addEventListener("click", function () {

        window.location.href =
            "additional.html";

    });
}


// ============================================================
// PAGE 2 - ADDITIONAL DETAILS
// ============================================================

const additionalForm =
    document.getElementById("additionalForm");


if (additionalForm) {


    // ----------------------------------------------------------
    // Get saved eligibility data
    // ----------------------------------------------------------

    const savedData =
        sessionStorage.getItem(
            "eligibilityData"
        );


    if (!savedData) {

        alert(
            "Eligibility information was not found. Please complete the eligibility check first."
        );

        window.location.href =
            "index.html";

    } else {

        let data;

        try {

            data =
                JSON.parse(savedData);
} catch (error) {

    console.error(
        "Invalid eligibility data:",
        error
    );

    sessionStorage.removeItem(
        "eligibilityData"
    );

    window.location.href =
        "index.html";
}

        // ------------------------------------------------------
        // Populate page 2 fields
        // ------------------------------------------------------

        const fullName =
            document.getElementById("fullName");

        const dateOfBirth =
            document.getElementById("dateOfBirth");

        const age =
            document.getElementById("age");

        const additionalCitizenship =
            document.getElementById(
                "additionalCitizenship"
            );

        const alreadyVoter =
            document.getElementById(
                "alreadyVoter"
            );


        if (fullName) {

            fullName.value =
                data.name || "";

        }


        if (dateOfBirth) {

            dateOfBirth.value =
                data.dob || "";

        }


        if (age) {

            age.value =
                data.age ?? "";

        }


        if (additionalCitizenship) {

            additionalCitizenship.value =
                data.citizenship || "";

        }


        if (alreadyVoter) {

            alreadyVoter.value =
                data.registered || "";

        }


        // ------------------------------------------------------
        // Voter ID section
        // ------------------------------------------------------

        const voterIdGroup =
            document.getElementById(
                "voterIdGroup"
            );

        const voterIdInput =
            document.getElementById(
                "voterId"
            );


        if (data.registered === "Yes") {

            if (voterIdGroup) {

                voterIdGroup.classList.remove(
                    "hidden"
                );
            }

            if (voterIdInput) {

                voterIdInput.required = true;
            }

        } else {

            if (voterIdGroup) {

                voterIdGroup.classList.add(
                    "hidden"
                );
            }

            if (voterIdInput) {

                voterIdInput.required = false;

                voterIdInput.value = "";
            }
        }


        // ======================================================
        // PAGE 2 SUBMIT
        // ======================================================

        additionalForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                // ------------------------------------------------
                // Get form values
                // ------------------------------------------------

                const phone =
                    document.getElementById(
                        "phone"
                    ).value.trim();


                const genderElement =
                    document.querySelector(
                        'input[name="gender"]:checked'
                    );


                const gender =
                    genderElement
                        ? genderElement.value
                        : "";


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


                const voterId =
                    voterIdInput
                        ? voterIdInput.value.trim()
                        : "";


                // ------------------------------------------------
                // Validation
                // ------------------------------------------------

                if (!gender) {

                    alert(
                        "Please select your gender."
                    );

                    return;
                }


                // Indian mobile number
                const phonePattern =
                    /^[6-9][0-9]{9}$/;


                if (!phonePattern.test(phone)) {

                    alert(
                        "Please enter a valid 10-digit Indian mobile number."
                    );

                    document.getElementById(
                        "phone"
                    ).focus();

                    return;
                }


                // Pincode
                const pincodePattern =
                    /^[0-9]{6}$/;


                if (!pincodePattern.test(pincode)) {

                    alert(
                        "Please enter a valid 6-digit pincode."
                    );

                    document.getElementById(
                        "pincode"
                    ).focus();

                    return;
                }


                // Aadhaar
                const aadhaarPattern =
                    /^[0-9]{12}$/;


                if (!aadhaarPattern.test(aadhaar)) {

                    alert(
                        "Please enter a valid 12-digit Aadhaar number."
                    );

                    document.getElementById(
                        "aadhaar"
                    ).focus();

                    return;
                }


                // Voter ID
                if (data.registered === "Yes") {

                    if (!voterId) {

                        alert(
                            "Please enter your Voter ID."
                        );

                        if (voterIdInput) {
                            voterIdInput.focus();
                        }

                        return;
                    }
                }


                //------------------------------------------------
                // Disable submit button
                // ------------------------------------------------

                const submitButton =
                    additionalForm.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled = true;

                    submitButton.textContent =
                        "Saving...";
                }


                try {

                    // --------------------------------------------
                    // Create request
                    // --------------------------------------------

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
                        voterId
                    );


                    // --------------------------------------------
                    // Send to Java backend
                    // --------------------------------------------

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


                    const resultData =
                        await response.json();


                    console.log(
                        "Save response:",
                        resultData
                    );


                    // --------------------------------------------
                    // Check server error
                    // --------------------------------------------

                    if (
                        !response.ok ||
                        resultData.success === false
                    ) {

                        throw new Error(
                            resultData.message ||
                            "Unable to save voter details."
                        );
                    }


                    // --------------------------------------------
                    // Success
                    // --------------------------------------------

                    alert(
                        resultData.message ||
                        "Your details have been saved successfully."
                    );


                    // Remove temporary session data
                    sessionStorage.removeItem(
                        "eligibilityData"
                    );


                    // Optional success message
                    const saveResult =
                        document.getElementById(
                            "saveResult"
                        );


                    if (saveResult) {

                        saveResult.classList.remove(
                            "hidden"
                        );

                        saveResult.innerHTML = `

                            <h2>✅ Details Saved Successfully</h2>

                            <p>
                                Your voter eligibility details
                                have been saved successfully.
                            </p>

                        `;
                    }

                }


                // ------------------------------------------------
                // PAGE 2 ERROR
                // ------------------------------------------------

                catch (error) {

                    console.error(
                        "Save error:",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to save your details."
                    );
                }


                finally {

                    if (submitButton) {

                        submitButton.disabled = false;

                        submitButton.textContent =
                            "Submit";
                    }
                }

            }
        );
    }
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    if (value === null || value === undefined) {

        return "";
    }


    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}
