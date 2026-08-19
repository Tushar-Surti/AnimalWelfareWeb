<?php

$username = $_POST['username'];
$password = $_POST['password'];

$host = "127.0.0.1";
$port = "3306";
$db = "miniproj";
$usr = "root";
$pwd = ""; 

$conn = new mysqli($host, $usr, $pwd, $db, $port);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Prepare the SQL statement
$sql = "SELECT * FROM users WHERE username = ?";
$statement = $conn->prepare($sql);
$statement->bind_param("s", $username);
$statement->execute();
$result = $statement->get_result();

if ($result->num_rows == 1) {
    $row = $result->fetch_assoc();
    
    // Verify password (assuming the password in the database is hashed)
    if (password_verify($password, $row['password'])) {
        header("Location: animal_insertion.html");
        exit();
    } else {
        displayInvalidLoginMessage();
    }
} else {
    displayInvalidLoginMessage();
}

$statement->close();
$conn->close();

function displayInvalidLoginMessage() {
    // Invalid login message styling
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
            <h2>Invalid Login</h2>
            <p>Username or Password is incorrect. Please try again.</p>
            <a href='login.html'>Back to Login</a>
          </div>";
}

?>