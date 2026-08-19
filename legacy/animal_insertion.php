<?php
// Database connection
$servername = "127.0.0.1"; // Change to your database server details
$username = "root";        // Change to your database username
$password = "";            // Change to your database password
$dbname = "miniproj"; // Change to your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get the form data
$animalName = $_POST['animal-name'];
$description = $_POST['description'];
$address = $_POST['address'];
$pincode = $_POST['pincode'];
$contact = $_POST['contact'];

// Prepare and bind
$stmt = $conn->prepare("INSERT INTO animal_details (animal_name, description, address, pincode, contact) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $animalName, $description, $address, $pincode, $contact);

// Execute the query
if ($stmt->execute()) {
    echo "<div style='display: flex; justify-content: center; align-items: center; height: 100vh; background: #f54ea2; font-family: Arial, sans-serif;'>
            <div style='text-align: center; padding: 20px; border: 2px solid #4CAF50; border-radius: 10px; max-width: 400px; background-color: #ffffff;'>
                <h2 style='color: #4CAF50;'>Record Added Successfully!</h2>
                <p id='countdown'>You will be redirected to the home page in <strong>5</strong> seconds.</p>
            </div>
          </div>";
    echo "<script>
            let countdownNumber = 5;
            const countdownElement = document.getElementById('countdown');

            const countdownInterval = setInterval(() => {
                countdownNumber--;
                countdownElement.innerHTML = 'You will be redirected to the home page in <strong>' + countdownNumber + '</strong> seconds.';
                
                if (countdownNumber === 0) {
                    clearInterval(countdownInterval);
                    window.location.href = 'index.html';
                }
            }, 1000); // Updates every 1 second
          </script>";
} else {
    echo "Error: " . $stmt->error;
}

// Close the connection
$stmt->close();
$conn->close();
?>
