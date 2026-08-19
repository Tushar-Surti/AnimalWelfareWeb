<?php
// Start the session
session_start();

// Retrieve form data
$username = $_POST['username'];
$password = $_POST['password'];

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

// Fetch the user's record from the database based on the username
$sql = "SELECT * FROM ngo WHERE username = ?";
$statement = $conn->prepare($sql);
$statement->bind_param("s", $username);
$statement->execute();
$result = $statement->get_result();

if ($result->num_rows == 1) {
    // If the user exists, verify the password
    $user = $result->fetch_assoc();

    if (password_verify($password, $user['password'])) {
        // Password matches
        // Set up a session for logged-in users
        $_SESSION['username'] = $username;
        header("Location: search.html");
        exit(); // Always good to call exit after header redirection
    } else {
        // Invalid password
        displayError("Invalid Username/Password");
    }
} else {
    // Invalid username
    displayError("Invalid Username/Password");
}

// Function to display error message
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
            <a href='ngo-login.html'>Back to Login</a>
          </div>";
}

// Close the statement and connection
$statement->close();
$conn->close();

?>
