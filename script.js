// CRUD Operations for Simple Database App

// Storage key
const STORAGE_KEY = 'crudItems';
const ID_COUNTER_KEY = 'crudItemsIdCounter';

// DOM Elements
const form = document.getElementById('item-form');
const itemIdInput = document.getElementById('item-id');
const itemNameInput = document.getElementById('item-name');
const itemEmpCodeInput = document.getElementById('item-emp-code');
const itemTalukNameInput = document.getElementById('item-taluk-name');
const itemDescriptionInput = document.getElementById('item-description');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const resetBtn = document.getElementById('reset-btn');
const formTitle = document.getElementById('form-title');
const itemsTbody = document.getElementById('items-tbody');
const itemsCount = document.getElementById('items-count');
const emptyMessage = document.getElementById('empty-message');
const exportExcelBtn = document.getElementById('export-excel-btn');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    
    // Form submit handler
    form.addEventListener('submit', handleFormSubmit);
    
    // Cancel button handler
    cancelBtn.addEventListener('click', resetForm);
    
    // Reset button handler
    resetBtn.addEventListener('click', resetForm);
    
    // Export to Excel button handler
    exportExcelBtn.addEventListener('click', exportToExcel);
});

// Get all items from localStorage
function getItems() {
    const itemsJson = localStorage.getItem(STORAGE_KEY);
    return itemsJson ? JSON.parse(itemsJson) : [];
}

// Save items to localStorage
function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Auto-export to Excel on every save (only if SheetJS is loaded)
    if (typeof XLSX !== 'undefined') {
        try {
            exportToExcel();
        } catch (error) {
            console.log('Auto-export skipped:', error);
        }
    }
}

// Generate unique numeric ID
function generateId() {
    let counter = parseInt(localStorage.getItem(ID_COUNTER_KEY)) || 0;
    counter++;
    localStorage.setItem(ID_COUNTER_KEY, counter.toString());
    return counter;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Load and display all items
function loadItems() {
    const items = getItems();
    itemsTbody.innerHTML = '';
    
    if (items.length === 0) {
        emptyMessage.style.display = 'block';
        itemsCount.textContent = 'No items found.';
    } else {
        emptyMessage.style.display = 'none';
        itemsCount.textContent = `Total items: ${items.length}`;
        
        items.forEach(item => {
            const row = createItemRow(item);
            itemsTbody.appendChild(row);
        });
    }
}

// Create table row for an item
function createItemRow(item) {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
        <td>${item.id}</td>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.empCode || 'N/A')}</td>
        <td>${escapeHtml(item.talukName || 'N/A')}</td>
        <td>${escapeHtml(item.description || 'N/A')}</td>
        <td>${formatDate(item.dateCreated)}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-edit" onclick="editItem('${item.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteItem('${item.id}')">Delete</button>
            </div>
        </td>
    `;
    
    return tr;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const name = itemNameInput.value.trim();
    const empCode = itemEmpCodeInput.value.trim();
    const talukName = itemTalukNameInput.value.trim();
    const description = itemDescriptionInput.value.trim();
    const id = itemIdInput.value;
    
    if (!name) {
        alert('Please enter a name for the item.');
        return;
    }
    
    if (!empCode) {
        alert('Please enter an employee code.');
        return;
    }
    
    if (!talukName) {
        alert('Please select a taluk name.');
        return;
    }
    
    const items = getItems();
    
    if (id) {
        // Update existing item
        const itemIndex = items.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
            items[itemIndex].name = name;
            items[itemIndex].empCode = empCode;
            items[itemIndex].talukName = talukName;
            items[itemIndex].description = description;
            saveItems(items);
            loadItems();
            resetForm();
            alert('Item updated successfully!');
        }
    } else {
        // Create new item
        const newItem = {
            id: generateId(),
            name: name,
            empCode: empCode,
            talukName: talukName,
            description: description,
            dateCreated: new Date().toISOString()
        };
        
        items.push(newItem);
        saveItems(items);
        loadItems();
        resetForm();
        alert('Item added successfully!');
    }
}

// Edit item
function editItem(id) {
    const items = getItems();
    const item = items.find(item => item.id === id);
    
    if (item) {
        itemIdInput.value = item.id;
        itemNameInput.value = item.name;
        itemEmpCodeInput.value = item.empCode || '';
        itemTalukNameInput.value = item.talukName || '';
        itemDescriptionInput.value = item.description || '';
        
        formTitle.textContent = 'Edit Item';
        submitBtn.textContent = 'Update Item';
        cancelBtn.style.display = 'inline-block';
        
        // Scroll to form
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        itemNameInput.focus();
    }
}

// Delete item
function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        const items = getItems();
        const filteredItems = items.filter(item => item.id !== id);
        saveItems(filteredItems);
        loadItems();
        
        // If we were editing this item, reset the form
        if (itemIdInput.value === id) {
            resetForm();
        }
        
        alert('Item deleted successfully!');
    }
}

// Reset form
function resetForm() {
    form.reset();
    itemIdInput.value = '';
    formTitle.textContent = 'Add New Item';
    submitBtn.textContent = 'Add Item';
    cancelBtn.style.display = 'none';
}

// Export items to Excel file
function exportToExcel() {
    // Check if SheetJS library is loaded
    if (typeof XLSX === 'undefined') {
        alert('Excel export library is loading. Please try again in a moment.');
        return;
    }
    
    const items = getItems();
    
    if (items.length === 0) {
        alert('No items to export. Please add some items first.');
        return;
    }
    
    // Prepare data for Excel - all items in sequence
    const excelData = items.map((item, index) => ({
        'S.No': index + 1,
        'ID': item.id,
        'Name': item.name,
        'Emp Code': item.empCode || '',
        'Taluk Name': item.talukName || '',
        'Description': item.description || '',
        'Date Created': formatDate(item.dateCreated)
    }));
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');
    
    // Generate Excel file with consistent filename - all entries in single sheet
    const fileName = 'CRUD_Items_Database.xlsx';
    XLSX.writeFile(workbook, fileName);
}

