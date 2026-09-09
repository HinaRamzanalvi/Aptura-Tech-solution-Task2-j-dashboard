// ==========================================
// INSIGHTHUB INTERACTIVE DASHBOARD
// ==========================================

let users = [];
let currentPage = 1;

const usersPerPage = 5;

let statusChart = null;
let departmentChart = null;


// ==========================================
// DOM ELEMENTS
// ==========================================

const loading = document.getElementById("loading");
const dashboard = document.getElementById("dashboard");
const errorState = document.getElementById("errorState");
const emptyState = document.getElementById("emptyState");

const tableBody = document.getElementById("userTableBody");

const searchInput = document.getElementById("searchInput");
const departmentFilter = document.getElementById("departmentFilter");
const statusFilter = document.getElementById("statusFilter");
const sortSelect = document.getElementById("sortSelect");

const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const inactiveUsers = document.getElementById("inactiveUsers");
const totalDepartments = document.getElementById("totalDepartments");

const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");


// ==========================================
// MODAL ELEMENTS
// ==========================================

const userModal = document.getElementById("userModal");
const closeModal = document.getElementById("closeModal");

const modalAvatar = document.getElementById("modalAvatar");
const modalName = document.getElementById("modalName");
const modalRole = document.getElementById("modalRole");
const modalEmail = document.getElementById("modalEmail");
const modalDepartment = document.getElementById("modalDepartment");
const modalStatus = document.getElementById("modalStatus");
const modalLocation = document.getElementById("modalLocation");
const modalJoinDate = document.getElementById("modalJoinDate");


// ==========================================
// FORM MODAL
// ==========================================

const formModal = document.getElementById("formModal");
const closeFormModal = document.getElementById("closeFormModal");

const userForm = document.getElementById("userForm");
const formTitle = document.getElementById("formTitle");

const editUserId = document.getElementById("editUserId");

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userDepartment = document.getElementById("userDepartment");
const userRole = document.getElementById("userRole");
const userStatus = document.getElementById("userStatus");
const userLocation = document.getElementById("userLocation");
const userJoinDate = document.getElementById("userJoinDate");


// ==========================================
// OTHER ELEMENTS
// ==========================================

const addUserBtn = document.getElementById("addUserBtn");
const exportBtn = document.getElementById("exportBtn");

const themeToggle = document.getElementById("themeToggle");
const settingsThemeBtn = document.getElementById("settingsThemeBtn");

const retryBtn = document.getElementById("retryBtn");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");


// ==========================================
// LOAD USERS
// ==========================================

async function loadUsers() {

    loading.classList.remove("hidden");
    dashboard.classList.add("hidden");
    errorState.classList.add("hidden");

    try {

        const savedUsers = localStorage.getItem("insightHubUsers");

        if (savedUsers) {

            users = JSON.parse(savedUsers);

        } else {

            const response = await fetch("data.json");

            if (!response.ok) {
                throw new Error("Unable to load data.json");
            }

            users = await response.json();

            saveUsers();

        }


        loading.classList.add("hidden");

        dashboard.classList.remove("hidden");

        updateStatistics();

        populateDepartmentFilter();

        updateCharts();

        applyFilters();

    } catch (error) {

        console.error(error);

        loading.classList.add("hidden");

        errorState.classList.remove("hidden");

    }

}


// ==========================================
// SAVE TO LOCAL STORAGE
// ==========================================

function saveUsers() {

    localStorage.setItem(
        "insightHubUsers",
        JSON.stringify(users)
    );

}


// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStatistics() {

    const total = users.length;


    const active = users.filter(
        user => user.status === "Active"
    ).length;


    const inactive = users.filter(
        user => user.status === "Inactive"
    ).length;


    const departments = new Set(
        users.map(user => user.department)
    ).size;


    totalUsers.textContent = total;
    activeUsers.textContent = active;
    inactiveUsers.textContent = inactive;
    totalDepartments.textContent = departments;

}


// ==========================================
// DEPARTMENT FILTER
// ==========================================

function populateDepartmentFilter() {

    const currentValue = departmentFilter.value;


    departmentFilter.innerHTML = `
        <option value="all">
            All Departments
        </option>
    `;


    const departments = [
        ...new Set(
            users.map(user => user.department)
        )
    ].sort();


    departments.forEach(department => {

        const option =
            document.createElement("option");

        option.value = department;

        option.textContent = department;

        departmentFilter.appendChild(option);

    });


    if (
        departments.includes(currentValue)
    ) {

        departmentFilter.value = currentValue;

    }

}


// ==========================================
// GET FILTERED USERS
// ==========================================

function getFilteredUsers() {

    const searchTerm =
        searchInput.value
            .toLowerCase()
            .trim();


    const selectedDepartment =
        departmentFilter.value;


    const selectedStatus =
        statusFilter.value;


    const selectedSort =
        sortSelect.value;


    let filteredUsers = [...users];


    // SEARCH

    if (searchTerm !== "") {

        filteredUsers =
            filteredUsers.filter(user => {

                return (

                    user.name
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    user.email
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    user.role
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    user.department
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    user.location
                        .toLowerCase()
                        .includes(searchTerm)

                );

            });

    }


    // DEPARTMENT

    if (selectedDepartment !== "all") {

        filteredUsers =
            filteredUsers.filter(
                user =>
                    user.department ===
                    selectedDepartment
            );

    }


    // STATUS

    if (selectedStatus !== "all") {

        filteredUsers =
            filteredUsers.filter(
                user =>
                    user.status ===
                    selectedStatus
            );

    }


    // SORT

    if (selectedSort === "name-asc") {

        filteredUsers.sort(
            (a, b) =>
                a.name.localeCompare(b.name)
        );

    }


    if (selectedSort === "name-desc") {

        filteredUsers.sort(
            (a, b) =>
                b.name.localeCompare(a.name)
        );

    }


    if (selectedSort === "date-new") {

        filteredUsers.sort(
            (a, b) =>
                new Date(b.joinDate) -
                new Date(a.joinDate)
        );

    }


    if (selectedSort === "date-old") {

        filteredUsers.sort(
            (a, b) =>
                new Date(a.joinDate) -
                new Date(b.joinDate)
        );

    }


    return filteredUsers;

}


// ==========================================
// RENDER USERS
// ==========================================

function renderUsers(data) {

    tableBody.innerHTML = "";


    if (data.length === 0) {

        emptyState.classList.remove("hidden");

        updatePagination(0);

        return;

    }


    emptyState.classList.add("hidden");


    const totalPages =
        Math.ceil(
            data.length / usersPerPage
        );


    if (currentPage > totalPages) {

        currentPage = totalPages;

    }


    const start =
        (currentPage - 1) *
        usersPerPage;


    const end =
        start + usersPerPage;


    const pageUsers =
        data.slice(start, end);


    pageUsers.forEach(user => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${escapeHTML(user.name)}
                </strong>
            </td>

            <td>
                ${escapeHTML(user.email)}
            </td>

            <td>
                ${escapeHTML(user.department)}
            </td>

            <td>
                ${escapeHTML(user.role)}
            </td>

            <td>

                <span class="status ${user.status.toLowerCase()}">
                    ${escapeHTML(user.status)}
                </span>

            </td>

            <td>
                ${escapeHTML(user.location)}
            </td>

            <td>

                <div class="actions">

                    <button
                        class="action-btn view-btn"
                        data-action="view"
                        data-id="${user.id}"
                    >
                        View
                    </button>

                    <button
                        class="action-btn edit-btn"
                        data-action="edit"
                        data-id="${user.id}"
                    >
                        Edit
                    </button>

                    <button
                        class="action-btn delete-btn"
                        data-action="delete"
                        data-id="${user.id}"
                    >
                        Delete
                    </button>

                </div>

            </td>
        `;


        tableBody.appendChild(row);

    });


    updatePagination(data.length);

}


// ==========================================
// APPLY FILTERS
// ==========================================

function applyFilters() {

    currentPage = 1;

    const filteredUsers =
        getFilteredUsers();

    renderUsers(filteredUsers);

}


// ==========================================
// PAGINATION
// ==========================================

function updatePagination(totalItems) {

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                totalItems / usersPerPage
            )
        );


    pageInfo.textContent =
        `Page ${currentPage} of ${totalPages}`;


    prevPage.disabled =
        currentPage <= 1;


    nextPage.disabled =
        currentPage >= totalPages;

}


// ==========================================
// PREVIOUS PAGE
// ==========================================

prevPage.addEventListener(
    "click",
    () => {

        if (currentPage > 1) {

            currentPage--;

            renderUsers(
                getFilteredUsers()
            );

        }

    }
);


// ==========================================
// NEXT PAGE
// ==========================================

nextPage.addEventListener(
    "click",
    () => {

        const totalPages =
            Math.ceil(
                getFilteredUsers().length /
                usersPerPage
            );


        if (currentPage < totalPages) {

            currentPage++;

            renderUsers(
                getFilteredUsers()
            );

        }

    }
);


// ==========================================
// TABLE ACTIONS
// ==========================================

tableBody.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".action-btn"
            );


        if (!button) {
            return;
        }


        event.stopPropagation();


        const id =
            String(button.dataset.id);


        const user =
            users.find(
                user =>
                    String(user.id) === id
            );


        if (!user) {
            return;
        }


        const action =
            button.dataset.action;


        if (action === "view") {

            openModal(user);

        }


        if (action === "edit") {

            openEditModal(user);

        }


        if (action === "delete") {

            deleteUser(user);

        }

    }
);


// ==========================================
// ROW CLICK
// ==========================================

tableBody.addEventListener(
    "click",
    event => {

        if (
            event.target.closest(
                ".action-btn"
            )
        ) {
            return;
        }


        const row =
            event.target.closest("tr");


        if (!row) {
            return;
        }


        const strong =
            row.querySelector("strong");


        if (!strong) {
            return;
        }


        const user =
            users.find(
                item =>
                    item.name ===
                    strong.textContent
            );


        if (user) {

            openModal(user);

        }

    }
);


// ==========================================
// OPEN VIEW MODAL
// ==========================================

function openModal(user) {

    const initials =
        getInitials(user.name);


    modalAvatar.textContent =
        initials;


    modalName.textContent =
        user.name;


    modalRole.textContent =
        user.role;


    modalEmail.textContent =
        user.email;


    modalDepartment.textContent =
        user.department;


    modalStatus.textContent =
        user.status;


    modalLocation.textContent =
        user.location;


    modalJoinDate.textContent =
        user.joinDate;


    userModal.classList.remove(
        "hidden"
    );

}


// ==========================================
// CLOSE VIEW MODAL
// ==========================================

closeModal.addEventListener(
    "click",
    () => {

        userModal.classList.add(
            "hidden"
        );

    }
);


userModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            userModal
        ) {

            userModal.classList.add(
                "hidden"
            );

        }

    }
);


// ==========================================
// ADD USER
// ==========================================

addUserBtn.addEventListener(
    "click",
    () => {

        openAddModal();

    }
);


function openAddModal() {

    formTitle.textContent =
        "Add New User";


    userForm.reset();


    editUserId.value = "";


    userJoinDate.value =
        new Date()
            .toISOString()
            .split("T")[0];


    formModal.classList.remove(
        "hidden"
    );

}


// ==========================================
// EDIT USER
// ==========================================

function openEditModal(user) {

    formTitle.textContent =
        "Edit User";


    editUserId.value =
        user.id;


    userName.value =
        user.name;


    userEmail.value =
        user.email;


    userDepartment.value =
        user.department;


    userRole.value =
        user.role;


    userStatus.value =
        user.status;


    userLocation.value =
        user.location;


    userJoinDate.value =
        user.joinDate;


    formModal.classList.remove(
        "hidden"
    );

}


// ==========================================
// CLOSE FORM MODAL
// ==========================================

closeFormModal.addEventListener(
    "click",
    () => {

        formModal.classList.add(
            "hidden"
        );

    }
);


formModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            formModal
        ) {

            formModal.classList.add(
                "hidden"
            );

        }

    }
);


// ==========================================
// SAVE USER
// ==========================================

userForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const id =
            editUserId.value;


        const userData = {

            id: id ||
                Date.now(),

            name:
                userName.value.trim(),

            email:
                userEmail.value.trim(),

            department:
                userDepartment.value.trim(),

            role:
                userRole.value.trim(),

            status:
                userStatus.value,

            location:
                userLocation.value.trim(),

            joinDate:
                userJoinDate.value

        };


        // EDIT

        if (id) {

            const index =
                users.findIndex(
                    user =>
                        String(user.id) ===
                        String(id)
                );


            if (index !== -1) {

                users[index] =
                    userData;

                showToast(
                    "User updated successfully ✓"
                );

            }

        }


        // ADD

        else {

            users.push(userData);

            showToast(
                "User added successfully ✓"
            );

        }


        saveUsers();


        updateStatistics();

        populateDepartmentFilter();

        updateCharts();


        formModal.classList.add(
            "hidden"
        );


        currentPage = 1;

        renderUsers(
            getFilteredUsers()
        );

    }
);


// ==========================================
// DELETE USER
// ==========================================

function deleteUser(user) {

    const confirmed =
        confirm(
            `Are you sure you want to delete ${user.name}?`
        );


    if (!confirmed) {
        return;
    }


    users =
        users.filter(
            item =>
                String(item.id) !==
                String(user.id)
        );


    saveUsers();


    updateStatistics();

    populateDepartmentFilter();

    updateCharts();


    currentPage = 1;


    renderUsers(
        getFilteredUsers()
    );


    showToast(
        "User deleted successfully"
    );

}


// ==========================================
// EXPORT CSV
// ==========================================

exportBtn.addEventListener(
    "click",
    exportCSV
);


function exportCSV() {

    if (users.length === 0) {

        showToast(
            "No users available to export"
        );

        return;

    }


    const headers = [
        "Name",
        "Email",
        "Department",
        "Role",
        "Status",
        "Location",
        "Join Date"
    ];


    const rows =
        users.map(user => [

            user.name,
            user.email,
            user.department,
            user.role,
            user.status,
            user.location,
            user.joinDate

        ]);


    let csv =
        headers.join(",") + "\n";


    rows.forEach(row => {

        csv +=
            row
                .map(value =>
                    `"${String(value)
                        .replace(/"/g, '""')}"`
                )
                .join(",") +
            "\n";

    });


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "insighthub-users.csv";


    link.click();


    URL.revokeObjectURL(url);


    showToast(
        "CSV exported successfully ✓"
    );

}


// ==========================================
// CHARTS
// ==========================================

function updateCharts() {

    const active =
        users.filter(
            user =>
                user.status === "Active"
        ).length;


    const inactive =
        users.filter(
            user =>
                user.status === "Inactive"
        ).length;


    const departmentCounts = {};


    users.forEach(user => {

        if (
            !departmentCounts[
                user.department
            ]
        ) {

            departmentCounts[
                user.department
            ] = 0;

        }


        departmentCounts[
            user.department
        ]++;

    });


    const departmentLabels =
        Object.keys(
            departmentCounts
        );


    const departmentValues =
        Object.values(
            departmentCounts
        );


    // Destroy old charts

    if (statusChart) {

        statusChart.destroy();

    }


    if (departmentChart) {

        departmentChart.destroy();

    }


    // Status Chart

    const statusCtx =
        document.getElementById(
            "statusChart"
        );


    statusChart =
        new Chart(
            statusCtx,
            {
                type: "doughnut",

                data: {

                    labels: [
                        "Active",
                        "Inactive"
                    ],

                    datasets: [{

                        data: [
                            active,
                            inactive
                        ]

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false

                }

            }
        );


    // Department Chart

    const departmentCtx =
        document.getElementById(
            "departmentChart"
        );


    departmentChart =
        new Chart(
            departmentCtx,
            {

                type: "bar",

                data: {

                    labels:
                        departmentLabels,

                    datasets: [{

                        label:
                            "Number of Users",

                        data:
                            departmentValues

                    }]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            beginAtZero:
                                true

                        }

                    }

                }

            }
        );

}


// ==========================================
// SEARCH
// ==========================================

searchInput.addEventListener(
    "input",
    applyFilters
);


departmentFilter.addEventListener(
    "change",
    applyFilters
);


statusFilter.addEventListener(
    "change",
    applyFilters
);


sortSelect.addEventListener(
    "change",
    applyFilters
);


// ==========================================
// DARK / LIGHT MODE
// ==========================================

function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "insightHubTheme",
        isDark
            ? "dark"
            : "light"
    );


    themeToggle.textContent =
        isDark
            ? "☀️"
            : "🌙";


    updateCharts();

}


themeToggle.addEventListener(
    "click",
    toggleTheme
);


settingsThemeBtn.addEventListener(
    "click",
    toggleTheme
);


// Load saved theme

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "insightHubTheme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeToggle.textContent =
            "☀️";

    }

}


// ==========================================
// TOAST
// ==========================================

let toastTimer;


function showToast(message) {

    toastMessage.textContent =
        message;


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


// ==========================================
// GET INITIALS
// ==========================================

function getInitials(name) {

    return name
        .split(" ")
        .map(word => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

}


// ==========================================
// SECURITY
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// RETRY
// ==========================================

retryBtn.addEventListener(
    "click",
    loadUsers
);


// ==========================================
// SIDEBAR NAVIGATION
// ==========================================

document
    .querySelectorAll(".nav-link")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".nav-link"
                    )
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );

                    });


                link.classList.add(
                    "active"
                );

            }
        );

    });


// ==========================================
// KEYBOARD ESCAPE
// ==========================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            userModal.classList.add(
                "hidden"
            );

            formModal.classList.add(
                "hidden"
            );

        }

    }
);


// ==========================================
// START APPLICATION
// ==========================================

loadTheme();

loadUsers();