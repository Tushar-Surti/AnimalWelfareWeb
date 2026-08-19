<?php

// Retrieve form data
$username = $_POST['username'];
$password = $_POST['password'];
$email = $_POST['email']; // Assuming email is also required

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
            <a href='signup.html'>Back to Signup</a>
          </div>";
    exit; // Stop further execution
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    displayError("Please enter a valid email format.");
}

// Check password strength (minimum 8 characters)
if (strlen($password) < 8) {
    displayError("Password must be at least 8 characters long.");
}

// Create a connection
$host = "127.0.0.1";
$port = "3306";
$db = "miniproj";
$usr = "root";
$pwd = ""; 

$conn = new mysqli($host, $usr, $pwd, $db, $port);

// Check the connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if username already exists
$sql_check = "SELECT * FROM users WHERE username = ?";
$check_stmt = $conn->prepare($sql_check);
$check_stmt->bind_param("s", $username);
$check_stmt->execute();
$result_check = $check_stmt->get_result();

if ($result_check->num_rows > 0) {
    displayError("Username already exists. Please choose a different username.");
}

// Hash the password for security
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Insert new user into the database
$sql = "INSERT INTO users (username, password, email) VALUES (?, ?, ?)";
$statement = $conn->prepare($sql);
$statement->bind_param("sss", $username, $hashed_password, $email);

if ($statement->execute()) {
    echo "<div style='display: flex; justify-content: center; align-items: center; height: 100vh; background: #f54ea2; font-family: Arial, sans-serif;'>
            <div style='text-align: center; padding: 20px; border: 2px solid #4CAF50; border-radius: 10px; max-width: 400px; background-color: #ffffff;'>
                <h2 style='color: #4CAF50;'>Signup Successful!</h2>
                <p id='countdown'>You will be redirected to the login page in <strong>5</strong> seconds.</p>
            </div>
          </div>";
    echo "<script>
            let countdownNumber = 5;
            const countdownElement = document.getElementById('countdown');

            const countdownInterval = setInterval(() => {
                countdownNumber--;
                countdownElement.innerHTML = 'You will be redirected to the login page in <strong>' + countdownNumber + '</strong> seconds.';
                
                if (countdownNumber === 0) {
                    clearInterval(countdownInterval);
                    window.location.href = 'login.html';
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
