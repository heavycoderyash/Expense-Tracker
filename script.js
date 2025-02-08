const apiKey = 'e74a64a70a324657ba30c9cfa197920b'
let expenses = JSON.parse(localStorage.getItem('expenses')) || []
let exchangeRates = {}
let categoryChart = null
let currencyChart = null
let currentEditingIndex = -1

const submitBtn = document.getElementById('submit-btn')
const cancelBtn = document.getElementById('cancel-btn')
const editModeIndicator = document.getElementById('edit-mode-indicator')
const expenseForm = document.getElementById('expense-form')

function resetForm() {
    currentEditingIndex = -1
    expenseForm.reset()
    submitBtn.textContent = 'Add Expense'
    cancelBtn.style.display = 'none'
    editModeIndicator.style.display = 'none'
}

function editExpense(index) {
    currentEditingIndex = index
    const expense = expenses[index]

    document.getElementById('description').value = expense.description
    document.getElementById('amount').value = expense.amount
    document.getElementById('currency').value = expense.currency
    document.getElementById('category').value = expense.category

    submitBtn.textContent = 'Update Expense'
    cancelBtn.style.display = 'inline-block'
    editModeIndicator.style.display = 'block'

    document.querySelector('.card').scrollIntoView({ behavior: 'smooth' })
}

cancelBtn.addEventListener('click', resetForm)

expenseForm.addEventListener('submit', function (e) {
    e.preventDefault()

    const description = document.getElementById('description').value
    const amount = parseFloat(document.getElementById('amount').value)
    const currency = document.getElementById('currency').value
    const category = document.getElementById('category').value

    if (currency === "default" || category === "default") {
        alert("Please select a valid currency and category before adding an expense.")
        return
    }

    if (currentEditingIndex >= 0) {
        expenses[currentEditingIndex] = { description, amount, currency, category }
        resetForm()
    } else {
        expenses.push({ description, amount, currency, category })
        expenseForm.reset()
    }

    updateExpensesDisplay()
})

async function fetchExchangeRates() {
    try {
        const response = await fetch(`https://open.exchangerate-api.com/v6/latest/USD?app_id=${apiKey}`)
        const data = await response.json()
        exchangeRates = data.rates
        return true
    } catch (error) {
        console.error('Error fetching exchange rates:', error)
        exchangeRates = {
            INR: 1,
            USD: 83.28,
            EUR: 89.51,
            GBP: 104.7,
            CNY: 11.56,
            RUB: 0.92,
            SAR: 22.21
        }
        return false
    }
}

function convertCurrency(amount, fromCurrency, toCurrency) {
    if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
        return amount
    }
    const amountInUSD = amount / exchangeRates[fromCurrency]
    return amountInUSD * exchangeRates[toCurrency]
}

function updateTotalExpenses() {
    const total = expenses.reduce((sum, expense) => {
        return sum + convertCurrency(expense.amount, expense.currency, 'INR')
    }, 0)

    document.getElementById('total-expenses').textContent = `Total Expenses: ₹${total.toFixed(2)}`
}

function updateExpensesDisplay() {
    const container = document.getElementById('expenses-container')
    container.innerHTML = ''

    expenses.forEach((expense, index) => {
        const amountInINR = convertCurrency(expense.amount, expense.currency, 'INR')
        const div = document.createElement('div')
        div.className = 'expense-item'
        div.innerHTML = `
            <div>
                <strong>${expense.description}</strong> - 
                ${expense.category} - 
                ₹${amountInINR.toFixed(2)}
                (Original: ${expense.amount} ${expense.currency})
            </div>
            <div>
                <button class="edit-btn" onclick="editExpense(${index})">Edit</button>
                <button class="delete-btn" onclick="deleteExpense(${index})">Delete</button>
            </div>
        `
        container.appendChild(div)
    })

    updateTotalExpenses()
    updateCharts()
    localStorage.setItem('expenses', JSON.stringify(expenses))
}

function deleteExpense(index) {
    expenses.splice(index, 1)
    updateExpensesDisplay()
}

function updateCharts() {
    const categoryData = {}
    const currencyData = {}

    expenses.forEach((expense) => {
        const amountInINR = convertCurrency(expense.amount, expense.currency, 'INR')

        if (categoryData[expense.category]) {
            categoryData[expense.category] += amountInINR
        } else {
            categoryData[expense.category] = amountInINR
        }

        if (currencyData[expense.currency]) {
            currencyData[expense.currency] += expense.amount
        } else {
            currencyData[expense.currency] = expense.amount
        }
    })

    if (categoryChart) {
        categoryChart.destroy()
    }

    const categoryLabels = Object.keys(categoryData)
    const categoryValues = Object.values(categoryData)
    const categoryCtx = document.getElementById('category-chart').getContext('2d')

    categoryChart = new Chart(categoryCtx, {
        type: 'pie',
        data: {
            labels: categoryLabels,
            datasets: [{
                label: 'Expenses by Category (INR)',
                data: categoryValues,
                backgroundColor: categoryLabels.map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`)
            }]
        }
    })

    if (currencyChart) {
        currencyChart.destroy()
    }

    const currencyLabels = Object.keys(currencyData)
    const currencyValues = Object.values(currencyData)
    const currencyCtx = document.getElementById('currency-chart').getContext('2d')

    currencyChart = new Chart(currencyCtx, {
        type: 'bar',
        data: {
            labels: currencyLabels,
            datasets: [{
                label: 'Expenses by Currency',
                data: currencyValues,
                backgroundColor: currencyLabels.map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`)
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    })
}

async function initialise() {
    await fetchExchangeRates()
    updateExpensesDisplay()
}

initialise()