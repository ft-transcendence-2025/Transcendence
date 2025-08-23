// Returns the content for the notifications modal with tabs
export async function getNotificationsContent(): Promise<HTMLElement> {
  // Create the main container for the notifications modal
  const container = document.createElement("div");
  container.className = "notifications-modal w-full h-full flex flex-col";

  // Create the tabs navigation
  const tabs = document.createElement("div");
  tabs.className = "tabs flex bg-[--color-primary-light] rounded-t-lg overflow-hidden";

  const tabButtons = ["Last Messages", "Friend Requests", "Game\nInvites"];
  const tabContents: HTMLElement[] = [];

  tabButtons.forEach((tabName, index) => {
    const tabButton = document.createElement("button");
    tabButton.className = `tab-button flex-1 py-2 font-bold text-(--color-text-primary) transition-colors cursor-pointer ${
      index === 0 ? "border-b-2 border-(--color-primary) text-(--color-primary-dark)" : ""
    }`;
    tabButton.innerHTML = tabName.replace("\n", "<br>");

    tabButton.addEventListener("click", () => {
      // Switch tab content visibility
      tabContents.forEach((content, i) => {
        content.style.display = i === index ? "block" : "none";
      });

      // Update tab button styles
      tabs.querySelectorAll(".tab-button").forEach((btn, i) => {
        btn.classList.toggle("border-b-2", i === index);
        btn.classList.toggle("border-(--color-primary)", i === index);
        btn.classList.toggle("text-(--color-primary-dark)", i === index);
        btn.classList.toggle("text-(--color-text-primary)", i !== index);
      });
    });

    tabs.appendChild(tabButton);

    // Create the content container for each tab
    const tabContent = document.createElement("div");
    tabContent.className = "tab-content flex-1 p-4";
    tabContent.style.display = index === 0 ? "block" : "none"; // Show only the first tab by default
    tabContents.push(tabContent);
  });

  // Add the tabs to the container
  container.appendChild(tabs);

  // Add the content containers below the tabs
  tabContents.forEach((tabContent) => {
    container.appendChild(tabContent);
  });

  // Add placeholder content for each tab
  tabContents[0].innerHTML = "<p>Last Messages content goes here.</p>";
  tabContents[1].innerHTML = "<p>Friend Requests content goes here.</p>";
  tabContents[2].innerHTML = "<p>Game Invites content goes here.</p>";

  return container;
}