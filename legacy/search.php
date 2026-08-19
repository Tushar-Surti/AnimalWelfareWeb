<?php
// Database connection details from animal_insertion.php
$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "miniproj";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get the pincode from the POST request
$pincode = intval($_POST['pincode']);
$range = 5;

// Define min and max pincode range
$min_pincode = $pincode - $range;
$max_pincode = $pincode + $range;

// Prepare SQL query to fetch records within the pincode range
$sql = "SELECT id, animal_name, description, address, pincode, contact FROM animal_details WHERE pincode BETWEEN $min_pincode AND $max_pincode";
$result = $conn->query($sql);

// Display the results
echo "<style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f54ea2; /* Solid pink background */
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            color: #333;
            text-align: center;
        }
        .results {
            background-color: #ffffff; /* White background for results */
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 90%;
            text-align: left;
        }
        .results h3 {
            color: #ff3f72; /* Accent color for the header */
            margin-bottom: 20px;
            font-size: 1.8em;
            font-weight: bold;
        }
        .results ul {
            list-style-type: none;
            padding: 0;
            margin: 0;
        }
        .results li {
            background: #ffe3e9; /* Soft pink for list items */
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 15px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s, box-shadow 0.2s; /* Smooth transition for hover effects */
        }
        .results li:hover {
            transform: translateY(-5px); /* Raise the item on hover */
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3); /* Enhance shadow on hover */
        }
        .results li strong {
            color: #d5006d; /* Deeper pink for animal names */
            font-size: 1.3em; /* Larger font size for emphasis */
        }
        .contact-info {
            margin-top: 10px;
            font-size: 0.95em;
            color: #555;
            font-style: italic; /* Italicized contact info for distinction */
        }
        @media (max-width: 600px) {
            .results {
                padding: 20px; /* Adjust padding for smaller screens */
            }
            .results h3 {
                font-size: 1.5em; /* Adjust header size for smaller screens */
            }
            .results li {
                padding: 15px; /* Adjust padding for list items */
            }
        }
    </style>";

if ($result->num_rows > 0) {
    echo "<div class='results'><h3>Animals found nearby:</h3><ul>";
    while ($row = $result->fetch_assoc()) {
        echo "<li>
                <strong>" . htmlspecialchars($row["animal_name"]) . "</strong><br>
                " . htmlspecialchars($row["description"]) . "<br>
                <span class='contact-info'>Location: " . htmlspecialchars($row["address"]) . ", Pincode: " . htmlspecialchars($row["pincode"]) . "<br>
                Contact: " . htmlspecialchars($row["contact"]) . "</span>
              </li>";
    }
    echo "</ul></div>";
} else {
    echo "<div class='results'><h3>No animals found in this pincode range.</h3></div>";
}

// Close connection
$conn->close();
?>
