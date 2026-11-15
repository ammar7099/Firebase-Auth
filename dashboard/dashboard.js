import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import { db, auth } from "../firebase.config.js";

const todoInput = document.getElementById("todo-input");
const todoBtn = document.getElementById("todo-btn");
const todosList = document.getElementById("todos");
const greetingText = document.getElementById("greeting-text");
const todoMessage = document.getElementById("todo-message");

let currentUser = null;
let isAddingTodo = false;

// LOADING BUTTON
const setLoading = (button, loadingText, isLoading, originalText) => {
  if (!button) return;

  button.disabled = isLoading;

  button.innerHTML = isLoading
    ? `<span class="spinner-border spinner-border-sm me-2"
             aria-hidden="true"></span>${loadingText}`
    : originalText;
};

// SHOW MESSAGE
const showMessage = (message, isError = false) => {
  if (!todoMessage) return;

  todoMessage.textContent = message;

  todoMessage.className = isError
    ? "small mb-3 text-danger"
    : "small mb-3 text-info";
};

// LOAD USER NAME
const loadProfile = async (user) => {
  try {
    const profileRef = doc(db, "users", user.uid);
    const profileSnapshot = await getDoc(profileRef);

    const profile = profileSnapshot.exists()
      ? profileSnapshot.data()
      : {};

    let name =
      profile.fullName ||
      profile.username ||
      user.displayName;

    if (!name) {
      const emailName = user.email?.split("@")[0] || "User";

      name = emailName
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
    }

    greetingText.textContent = `Welcome back, ${name}!`;

  } catch (error) {
    console.error("Profile loading error:", error);
    greetingText.textContent = "Welcome back!";
  }
};

// ADD TODO
const addTodo = async () => {
  if (isAddingTodo) return;

  const name = todoInput.value.trim();

  if (!currentUser) {
    showMessage("Please log in to manage your tasks.", true);
    return;
  }

  if (!name) {
    showMessage("Please enter a task first.", true);
    todoInput.focus();
    return;
  }

  isAddingTodo = true;

  setLoading(todoBtn, "Adding...", true, "Add Todo");
  showMessage("");

  // Spinner display duration: 500ms
  const spinnerTimer = new Promise(resolve => {
    setTimeout(resolve, 500);
  });

  try {
    // Start saving the task to Firebase
    const saveTask = addDoc(collection(db, "todos"), {
      name: name,
      user_uid: currentUser.uid,
      created_at: Date.now(),
    });

    // Wait at least 500ms before hiding spinner
    await spinnerTimer;

    setLoading(todoBtn, "Adding...", false, "Add Todo");

    // Still wait for Firebase to confirm the save
    await saveTask;

    todoInput.value = "";

    await getTodos();

    showMessage("Task added successfully!");

  } catch (error) {
    console.error("Add Todo error:", error);
    showMessage("Could not add your task. Please try again.", true);

  } finally {
    setLoading(todoBtn, "Adding...", false, "+ Add Todo");
    isAddingTodo = false;
  }
};

// GET TODOS
const getTodos = async () => {
  if (!currentUser) return;

  todosList.replaceChildren();

  try {
    const todosQuery = query(
      collection(db, "todos"),
      where("user_uid", "==", currentUser.uid)
    );

    const snapshot = await getDocs(todosQuery);

    if (snapshot.empty) {
      const emptyItem = document.createElement("li");

      emptyItem.className =
        "list-group-item text-center text-secondary";

      emptyItem.textContent =
        "No tasks yet. Add your first task above!";

      todosList.appendChild(emptyItem);
      return;
    }

    snapshot.forEach(todoDocument => {
      const todo = todoDocument.data();
      const todoId = todoDocument.id;

      const item = document.createElement("li");

      item.className =
        "list-group-item d-flex justify-content-between align-items-center gap-3";

      const taskName = document.createElement("span");

      taskName.className = "flex-grow-1";
      taskName.textContent = todo.name || "Untitled task";

      const actions = document.createElement("div");
      actions.className = "d-flex gap-2 flex-shrink-0";

      // EDIT BUTTON
      const editButton = document.createElement("button");

      editButton.type = "button";
      editButton.className = "btn btn-sm btn-outline-info";
      editButton.textContent = "Edit";

      editButton.addEventListener("click", async () => {
        const updatedName = prompt(
          "Edit your task:",
          todo.name || ""
        );

        if (updatedName === null) return;

        const trimmedName = updatedName.trim();

        if (!trimmedName) {
          alert("Task cannot be empty.");
          return;
        }

        editButton.disabled = true;
        editButton.textContent = "Saving...";

        try {
          await updateDoc(doc(db, "todos", todoId), {
            name: trimmedName,
            updated_at: Date.now(),
          });

          await getTodos();
          showMessage("Task updated successfully!");

        } catch (error) {
          console.error("Edit Todo error:", error);

          showMessage("Could not update the task.", true);

          editButton.disabled = false;
          editButton.textContent = "Edit";
        }
      });

      // DELETE BUTTON
      const deleteButton = document.createElement("button");

      deleteButton.type = "button";
      deleteButton.className = "btn btn-sm btn-outline-danger";
      deleteButton.textContent = "Delete";

      deleteButton.addEventListener("click", async () => {
        const startedAt = Date.now();

        setLoading(
          deleteButton,
          "Deleting...",
          true,
          "Delete"
        );

        try {
          await deleteDoc(doc(db, "todos", todoId));

          const remainingTime = Math.max(
            0,
            500 - (Date.now() - startedAt)
          );

          await new Promise(resolve =>
            setTimeout(resolve, remainingTime)
          );

          await getTodos();

          showMessage("Task deleted successfully!");

        } catch (error) {
          console.error("Delete Todo error:", error);

          showMessage("Could not delete the task.", true);

          setLoading(
            deleteButton,
            "Deleting...",
            false,
            "Delete"
          );
        }
      });

      actions.append(editButton, deleteButton);
      item.append(taskName, actions);
      todosList.appendChild(item);
    });

  } catch (error) {
    console.error("Get Todos error:", error);

    showMessage(
      "Could not load tasks. Check your connection and Firebase rules.",
      true
    );
  }
};

// CHECK LOGIN AND LOAD DASHBOARD
onAuthStateChanged(auth, async user => {
  if (!user) return;

  currentUser = user;

  await loadProfile(user);
  await getTodos();
});

// BUTTON EVENTS
todoBtn?.addEventListener("click", addTodo);

todoInput?.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    addTodo();
  }
});