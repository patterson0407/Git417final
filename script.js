"use strict"; // Enforce strict mode for better coding practices

document.addEventListener("DOMContentLoaded", function() {
  
  /* =============================
      LIGHT / DARK MODE TOGGLE
  ============================== */
  let themeToggle = document.getElementById("themeToggle");
  
  themeToggle.addEventListener("click", function() {
    document.body.classList.toggle("dark-mode");

    // Update the button text dynamically based on the mode
    themeToggle.textContent = document.body.classList.contains("dark-mode")
      ? "Light Mode"
      : "Dark Mode";
  });

  /* =============================
      SCROLL REVEAL ANIMATIONS
  ============================== */
  let revealSections = document.querySelectorAll(".reveal-on-scroll");

  // Create an Intersection Observer to detect when elements come into view
  let revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add the 'active' class when the section is visible
        entry.target.classList.add("active");
        // Stop observing once the animation has run
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  // Apply observer to all sections with the reveal effect
  revealSections.forEach(section => revealObserver.observe(section));

  /* =============================
      GUESSING GAME FUNCTIONALITY
  ============================== */
  let guessInput = document.getElementById("guessInput");
  let guessBtn = document.getElementById("guessBtn");
  let gameResult = document.getElementById("gameResult");
  // Generate random number from 1-10
  let randomNumber = Math.floor(Math.random() * 10) + 1;

  guessBtn.addEventListener("click", function() {
    let userGuess = parseInt(guessInput.value, 10);

    // Validate input
    if (isNaN(userGuess) || userGuess < 1 || userGuess > 10) {
      gameResult.textContent = "Please enter a valid number between 1 and 10.";
    } else if (userGuess === randomNumber) {
      gameResult.textContent = `You guessed ${userGuess}. The correct number was ${randomNumber}. You win!`;
    } else {
      gameResult.textContent = `You guessed ${userGuess}. The correct number was ${randomNumber}. Try again!`;
    }

    // Trigger fade-in effect for the result message
    gameResult.classList.remove("show");
    setTimeout(() => gameResult.classList.add("show"), 10);

    // Generate a new random number for the next round
    randomNumber = Math.floor(Math.random() * 10) + 1;
  });

  /* =============================
      PLINKO GAME USING MATTER.JS
  ============================== */
  // Matter.js modules
  let Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite;

  // Create a physics engine for the Plinko game
  let plinkoEngine = Engine.create();
  let plinkoWorld = plinkoEngine.world;
  let plinkoCanvas = document.getElementById("plinkoCanvas");

  // Configure the Matter.js renderer
  let plinkoRender = Render.create({
    canvas: plinkoCanvas,
    engine: plinkoEngine,
    options: {
      width: 800,
      height: 700,
      wireframes: false,     // false to show custom fills
      background: "transparent"
    }
  });

  // Run the renderer and engine
  Render.run(plinkoRender);
  let plinkoRunner = Runner.create();
  Runner.run(plinkoRunner, plinkoEngine);

  // Create boundaries: floor + invisible walls
  let ground = Bodies.rectangle(400, 680, 810, 20, { isStatic: true });
  let leftWall = Bodies.rectangle(0, 350, 10, 700, { 
    isStatic: true, 
    render: { fillStyle: "transparent", strokeStyle: "transparent" }
  });
  let rightWall = Bodies.rectangle(800, 350, 10, 700, { 
    isStatic: true, 
    render: { fillStyle: "transparent", strokeStyle: "transparent" }
  });

  // Add boundaries to the world
  Composite.add(plinkoWorld, [ground, leftWall, rightWall]);

  // Create pegs in a grid pattern for the Plinko board
  let pegOptions = { isStatic: true, render: { fillStyle: "#ffffff" } };
  
  for (let y = 100; y < 500; y += 50) {
    let row = Math.floor((y - 100) / 50);
    for (let x = 50; x < 750; x += 50) {
      // Offset every other row to create a staggered effect
      let offset = (row % 2 === 0) ? 0 : 25;
      let peg = Bodies.circle(x + offset, y, 5, pegOptions);
      Composite.add(plinkoWorld, peg);
    }
  }

  // Basket system
  let basketCount = 15;
  let basketWidth = 800 / basketCount;

  // Create vertical dividers to form baskets
  for (let i = 0; i <= basketCount; i++) {
    let divider = Bodies.rectangle(i * basketWidth, 650, 10, 40, { isStatic: true, render: { fillStyle: "#ffffff" } });
    Composite.add(plinkoWorld, divider);
  }

  // Generate random multipliers for each basket
  let basketMultipliers = [];
  for (let i = 0; i < basketCount; i++) {
    basketMultipliers.push(Math.floor(Math.random() * 5) + 1); // range 1-5
  }

  // Display basket multipliers as labels
  let basketLabelsDiv = document.getElementById("basketLabels");
  basketLabelsDiv.innerHTML = "";
  for (let i = 0; i < basketCount; i++) {
    let label = document.createElement("div");
    label.classList.add("basket-label");
    label.textContent = "x" + basketMultipliers[i];
    basketLabelsDiv.appendChild(label);
  }

  // Track score
  let score = 0;
  document.getElementById("scoreBox").textContent = "Score: " + score;

  // Launch ball with random offset to vary outcomes
  let currentBall = null;
  document.getElementById("launchBall").addEventListener("click", function() {
    // Only allow one ball at a time until it lands
    if (currentBall) return;

    let randomOffset = (Math.random() - 0.5) * 20; // random offset between -10 and +10
    currentBall = Bodies.circle(400 + randomOffset, 50, 10, { 
      restitution: 0.9,
      friction: 0.001,
      frictionAir: 0.001,
      render: { fillStyle: "#ff0000" }
    });

    Composite.add(plinkoWorld, currentBall);
  });

  // Periodically check if the ball has landed in a basket
  setInterval(function() {
    if (currentBall) {
      let speed = currentBall.speed;
      // If the ball's speed is low and near the bottom
      if (speed < 0.5 && currentBall.position.y > 640) {
        let basketIndex = Math.floor(currentBall.position.x / basketWidth);
        let multiplier = basketMultipliers[basketIndex];
        
        // Each ball is worth 1 point * multiplier
        let winPoints = 1 * multiplier;
        score += winPoints;
        document.getElementById("scoreBox").textContent = "Score: " + score;
        
        alert(`Ball landed in basket ${basketIndex + 1} (multiplier x${multiplier}). You won ${winPoints} points!`);
        
        // Remove ball from the world so a new one can be launched
        Composite.remove(plinkoWorld, currentBall);
        currentBall = null;
      }
    }
  }, 1000);

  /* =============================
      PRODUCT CAROUSEL FUNCTIONALITY
  ============================== */
  let carouselIndex = 0;
  // List of your products/services
  let carouselProducts = [
    {
      name: "Web Development",
      image: "assets/webdevelopment.jpeg",
      description: "Building responsive, accessible, and visually stunning websites using modern technologies.",
      rate: "$75/hr"
    },
    {
      name: "UI/UX Design",
      image: "assets/uxui.jpg",
      description: "Designing intuitive interfaces and engaging experiences that drive conversions.",
      rate: "$65/hr"
    },
    {
      name: "Consulting",
      image: "assets/consulting.jpg",
      description: "Offering expert advice and strategies to boost your digital presence.",
      rate: "$100/hr"
    }
  ];

  // Display a product by index
  function displayCarouselProduct(index) {
    document.getElementById("productName").textContent = carouselProducts[index].name;
    document.getElementById("productImage").src = carouselProducts[index].image;
    document.getElementById("productImage").alt = carouselProducts[index].name;
    // Insert the description + hourly rate
    document.getElementById("productDescription").innerHTML =
      carouselProducts[index].description + "<br><strong>Hourly Rate: " + carouselProducts[index].rate + "</strong>";
  }

  // Display the first product on page load
  displayCarouselProduct(carouselIndex);

  // Carousel arrow buttons
  let prevButton = document.querySelector(".carousel-button.prev");
  let nextButton = document.querySelector(".carousel-button.next");

  prevButton.addEventListener("click", function() {
    carouselIndex = (carouselIndex - 1 + carouselProducts.length) % carouselProducts.length;
    displayCarouselProduct(carouselIndex);
  });

  nextButton.addEventListener("click", function() {
    carouselIndex = (carouselIndex + 1) % carouselProducts.length;
    displayCarouselProduct(carouselIndex);
  });

  /* =============================
      CONTACT FORM VALIDATION
  ============================== */
  let contactForm = document.getElementById("contactForm");
  let submissionMessage = document.getElementById("submissionMessage");

  contactForm.addEventListener("submit", function(e) {
    e.preventDefault(); // Stop default form submission

    // Grab user inputs
    let fullName = document.getElementById("fullName").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let email = document.getElementById("email").value.trim();
    let comments = document.getElementById("comments").value.trim();
    let contactMethod = document.querySelector('input[name="contactMethod"]:checked');
    
    // Clear old error messages
    document.getElementById("nameError").textContent = "";
    document.getElementById("phoneError").textContent = "";
    document.getElementById("emailError").textContent = "";
    document.getElementById("commentsError").textContent = "";
    document.getElementById("contactMethodError").textContent = "";
    submissionMessage.textContent = "";

    let valid = true; // Track overall form validity

    // Require full name
    if (fullName === "") {
      document.getElementById("nameError").textContent = "Full name is required.";
      valid = false;
    }

    // Require comments
    if (comments === "") {
      document.getElementById("commentsError").textContent = "Comments are required.";
      valid = false;
    }

    // Check preferred contact method
    if (!contactMethod) {
      document.getElementById("contactMethodError").textContent = "Select a preferred contact method.";
      valid = false;
    } else {
      // If user chose phone, phone is required (with regex check)
      if (contactMethod.value === "phone") {
        if (phone === "") {
          document.getElementById("phoneError").textContent = "Phone is required if you prefer phone contact.";
          valid = false;
        } else {
          let phoneRegex = /^\d{10}$/; // 10-digit phone
          if (!phoneRegex.test(phone)) {
            document.getElementById("phoneError").textContent = "Enter a valid 10-digit phone number.";
            valid = false;
          }
        }
      }
      // If user chose email, email is required (with basic regex check)
      if (contactMethod.value === "email") {
        if (email === "") {
          document.getElementById("emailError").textContent = "Email is required if you prefer email contact.";
          valid = false;
        } else {
          let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            document.getElementById("emailError").textContent = "Enter a valid email address.";
            valid = false;
          }
        }
      }
    }

    // If any error occurred, don't proceed
    if (!valid) return;

    // Otherwise, create an object with the user's valid data
    let customer = {
      name: fullName,
      phone: phone,
      email: email,
      comments: comments,
      preferredContact: contactMethod.value
    };

    // Display a thank-you message, pulling user info from the customer object
    submissionMessage.innerHTML = `
      Thank you, <strong>${customer.name}</strong>!<br>
      We will contact you via <strong>${customer.preferredContact}</strong>.<br>
      Your message: "${customer.comments}"
    `;

    // Reset the form for a fresh start
    contactForm.reset();
  });

});
