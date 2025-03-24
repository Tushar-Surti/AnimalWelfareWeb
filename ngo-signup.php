<?php

// Retrieve form data
$username = $_POST['username'];
$email = $_POST['email'];
$phone = $_POST['phone'];
$password = $_POST['password'];
$confirm_password = $_POST['confirm-password'];
$address_line1 = $_POST['address-line1'];
$address_line2 = $_POST['address-line2'];
$landmark = $_POST['landmark'];
$pincode = $_POST['pincode'];

// Function to display error messages with a styled output
function displayError($message) {
    echo "<style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f54ea2; /* Pink background */
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                color: #333;
            }
            .message-container {
                background-color: rgba(255, 255, 255, 0.9); /* Slightly transparent white */
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                max-width: 400px;
                width: 90%;
                text-align: center;
            }
            .message-container h2 {
                color: #d5006d; /* Deep pink for the title */
                margin-bottom: 20px;
                font-size: 1.8em;
                font-weight: 700;
                text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.1);
            }
            .message-container p {
                color: #555; /* Darker color for the message */
                font-size: 1.2em;
                margin-bottom: 20px;
            }
            .message-container a {
                display: inline-block;
                margin-top: 15px;
                padding: 10px 20px;
                background-color: #4CAF50; /* Green button */
                color: white;
                border-radius: 4px;
                text-decoration: none;
                transition: background-color 0.3s ease;
            }
            .message-container a:hover {
                background-color: #45a049; /* Darker green on hover */
            }
        </style>";

    echo "<div class='message-container'>
            <h2>Error</h2>
            <p>$message</p>
            <a href='ngo-signup.html'>Back to Signup</a>
          </div>";
    exit; // Stop further execution
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    displayError("Please enter a valid email format.");
}

// Validate phone number (10 digits)
if (!preg_match('/^\d{10}$/', $phone)) {
    displayError("Phone number must be exactly 10 digits.");
}

// Check if passwords match
if ($password !== $confirm_password) {
    displayError("Passwords do not match.");
}

// Hash the password for security
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

$host = "127.0.0.1";
$port = "3306";
$db = "miniproj";
$usr = "root";
$pwd = "";

// Create a connection
$conn = new mysqli($host, $usr, $pwd, $db, $port);

// Check the connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if the username or email already exists
$sql_check = "SELECT * FROM ngo WHERE username = ? OR email = ?";
$check_stmt = $conn->prepare($sql_check);
$check_stmt->bind_param("ss", $username, $email);
$check_stmt->execute();
$result_check = $check_stmt->get_result();

if ($result_check->num_rows > 0) {
    displayError("Username or Email already exists. Please choose different credentials.");
}

// Insert new NGO into the database
$sql = "INSERT INTO ngo (username, email, phone, password, address_line1, address_line2, landmark, pincode) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
$statement = $conn->prepare($sql);
$statement->bind_param("ssssssss", $username, $email, $phone, $hashed_password, $address_line1, $address_line2, $landmark, $pincode);

if ($statement->execute()) {
    echo "<div style='display: flex; justify-content: center; align-items: center; height: 100vh; background: #f54ea2; font-family: Arial, sans-serif;'>
            <div style='text-align: center; padding: 20px; border: 2px solid #4CAF50; border-radius: 10px; max-width: 400px; background-color: #ffffff;'>
                <h2 style='color: #4CAF50;'>Signup Successful!</h2>
                <p id='countdown'>You will be redirected to the home page in <strong>5</strong> seconds.</p>
            </div>
          </div>";
    echo "<script>
            let countdownNumber = 5;
            const countdownElement = document.getElementById('countdown');

            const countdownInterval = setInterval(() => {
                countdownNumber--;
                countdownElement.innerHTML = 'You will be redirected to the Login Page in <strong>' + countdownNumber + '</strong> seconds.';
                
                if (countdownNumber === 0) {
                    clearInterval(countdownInterval);
                    window.location.href = 'ngo-login.html';
                }
            }, 1000); // Updates every 1 second
          </script>";
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}

// Close the statement and connection
$statement->close();
$conn->close();

?>
