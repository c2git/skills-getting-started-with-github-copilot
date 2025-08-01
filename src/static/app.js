document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            <ul class="participants-list">
              ${details.participants.length > 0
                ? details.participants.map(email => `
                  <li>
                    <span>${email}</span>
                    <button class="delete-participant" title="Remove participant" data-activity="${name}" data-email="${email}">&#128465;</button>
                  </li>
                `).join('')
                : '<li class="no-participants">No participants yet</li>'}
            </ul>
          </div>
        `;


        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Add delete event listeners after rendering
        setTimeout(() => {
          activityCard.querySelectorAll('.delete-participant').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.preventDefault();
              const activity = btn.getAttribute('data-activity');
              const email = btn.getAttribute('data-email');
              if (!confirm(`Remove ${email} from ${activity}?`)) return;
              try {
                const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
                  method: 'POST',
                });
                const result = await response.json();
                if (response.ok) {
                  fetchActivities();
                  messageDiv.textContent = result.message;
                  messageDiv.className = 'success';
                } else {
                  messageDiv.textContent = result.detail || 'An error occurred';
                  messageDiv.className = 'error';
                }
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 5000);
              } catch (error) {
                messageDiv.textContent = 'Failed to remove participant. Please try again.';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            });
          });
        }, 0);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh activities list after successful signup
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
