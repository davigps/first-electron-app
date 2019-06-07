$(document).ready(() => {

    const app = require('electron').remote.app
    const {remote} = require('electron')
    const fs = require('fs')
    let readableProducts = () => JSON.parse(fs.readFileSync('./data/products.json', 'utf8'))
    const tableBody = document.getElementById("tableBody")

    // Disable or Enable necessary buttons
    function disableButton(boolean, buttonsArray) {
        buttonsArray.forEach(button => {
            if (typeof button == NodeList) {
                disableButton(boolean, button)
            } else {
                button.disabled = boolean
            }
        })
    }

    // Identify Main Button
    const buttonsArray = []
    function identifyMainButton(id) {
        const element = document.getElementById(id)
        buttonsArray.push(element)
        return element
    }

    // Create List Item
    function createListItem(name, code) {
        const tableRow = document.createElement('tr')
        const productName = document.createElement('td')
        const productCode = document.createElement('td')
        productName.style.userSelect = 'text'
        productCode.style.userSelect = 'text'

        productName.innerHTML = name
        productCode.innerHTML = code

        tableRow.appendChild(productName)
        tableRow.appendChild(productCode)

        const copyButton = document.createElement('td')
        const editButton = document.createElement('td')
        const delButton = document.createElement('td')

        copyButton.innerHTML = '<button  id="btn" copy modifier class="btn btn-mini btn-primary"><span class="icon icon-docs"></span></button>'
        editButton.innerHTML = '<button id="btn" edit modifier class="btn btn-mini btn-positive"><span class="icon icon-pencil"></span></button>'
        delButton.innerHTML = '<button id="btn" del modifier class="btn btn-mini btn-negative"><span class="icon icon-cancel"></span></button>'
    
        tableRow.appendChild(copyButton)
        tableRow.appendChild(editButton)
        tableRow.appendChild(delButton)

        tableBody.appendChild(tableRow)
    }

    // Add Mini Function Buttons
    function addMiniButtons() {

        // Copy Buttons
        const copyButtonsNodeList = document.querySelectorAll('[copy]')
        copyButtonsNodeList.forEach(button => {
            button.onclick = e => {
                const tableRow = button.parentNode.parentNode
                const code = tableRow.children[1].innerHTML

        // Trying to clip
        navigator.permissions.query({name: "clipboard-write"}).then(result => {
            if (result.state == "granted" || result.state == "prompt") {
            navigator.clipboard.writeText(code).then(() => {}, () => {
                navigator.clipboard.writeText(code)
                })
            }
            })
            }
        })

        // Edit Buttons
        const editButtonsNodeList = document.querySelectorAll('[edit]')
        editButtonsNodeList.forEach(button => {
        button.onclick = e => {
        editMenu.style.display = 'block'
        document.getElementById('inputName').focus()
        document.getElementById('cancelProduct').style.display = 'none'

        document.getElementById('editLabel').innerHTML = 'Modificar Produto'
        disableButton(true, buttonsArray)
        onEditShortcut()

        const tableRow = button.parentNode.parentNode
        const oldName = tableRow.children[0].innerHTML
        const oldCode = tableRow.children[1].innerHTML

        document.getElementById('inputName').value = oldName
        document.getElementById('inputCode').value = oldCode

        removeProduct(oldName)
            }
        })

        // Del Buttons
        const delButtonsNodeList = document.querySelectorAll('[del]')
        delButtonsNodeList.forEach(button => {
            button.onclick = e => {
                const tableRow = button.parentNode.parentNode
                const name = tableRow.firstChild.innerHTML
                removeProduct(name)
                tableRow.parentNode.removeChild(tableRow)
            }
        })
    }

    // Update product list
    function updateProducts() {

        let tableBody = document.getElementById("tableBody");
        while (tableBody.firstChild) { tableBody.removeChild(tableBody.firstChild) }

        const jsonProducts = readableProducts()
        Object.keys(jsonProducts).sort().forEach(Product => {
            let name = jsonProducts[Product].name
            let code = jsonProducts[Product].code

            createListItem(name, code)
        })
        
        document.getElementById('search').value = ''

        addMiniButtons()
    }

    // Add Product to JSON
    function addProduct(name, code) {
        let jsonProducts = readableProducts()
        const lowerName = name.toLowerCase()
        jsonProducts[lowerName] = new Object
        jsonProducts[lowerName].name = name
        jsonProducts[lowerName].code = code
        jsonProducts = JSON.stringify(jsonProducts)
        fs.writeFileSync('./data/products.json', jsonProducts)
    }

    // Remove Existing Product
    function removeProduct(name) {
        let jsonProducts = readableProducts()
        delete jsonProducts[name.toLowerCase()]
        jsonProducts = JSON.stringify(jsonProducts)
        fs.writeFileSync('./data/products.json', jsonProducts)
    }

    // Edit Menu Shortcut
    function onEditShortcut() {
        const editLabel = document.getElementById('editLabel')
        const inputName = document.getElementById('inputName')
        const inputCode = document.getElementById('inputCode')
        let focused = true

        document.onkeyup = e => {
            keyCode = e.which
            
            // Esc
            if (keyCode == 27) {
                if (editLabel.innerHTML != 'Modificar Produto') {
                    closeEditMenu()
                }
            }
            // Enter
            if (keyCode == 13) {
                inputName.focus()
                focused = true
                confirm()
            }
            // Tab
            if (keyCode == 9) {
                if (focused) {
                    inputCode.focus()
                    focused = false
                } else {
                    inputName.focus()
                    focused = true
                }
            }
        }
    }
    function offEditShortcut() { document.onkeyup = e => {} }

    // Close Edit Menu Function
    function closeEditMenu() {
        updateProducts()
        editMenu.style.display = 'none'
        disableButton(false, buttonsArray)
        offEditShortcut()
    }

    // Confirm Function
    function confirm() {
        const inputName = document.getElementById('inputName')
        const inputCode = document.getElementById('inputCode')
        if (inputName.value == '' || inputCode.value == '') {
            const options = {
                type: 'question',
                buttons: ['OK'],
                title: 'Atenção!',
                message: 'Preencha os campos!'
            }
            
            remote.dialog.showMessageBox(null, options)
        } else {
            name = inputName.value.trim()
            code = inputCode.value.trim()
    
            addProduct(name, code)
            updateProducts()
    
            if (document.getElementById('editLabel').innerHTML == 'Modificar Produto') { 
                closeEditMenu()
                document.getElementById('cancelProduct').style.display = 'block'
            }
            inputName.value = ''
            inputCode.value = ''
        }
    }

    // Search Function
    function search(terms, products) {
        const productsKeysArray = Object.keys(products)

        const matchItems = []
        productsKeysArray.forEach(key => {
            if (key.indexOf(terms) != -1 && key != undefined) {
                matchItems.push(key)
            }
        })

        if (matchItems) {
            while (tableBody.firstChild) { tableBody.removeChild(tableBody.firstChild) }

            matchItems.forEach(item => {
                createListItem(products[item].name, products[item].code)
            })
            addMiniButtons()
        }
    }

    //
    //
    //
    ////// MAIN PROCESS //////
    //


    // Update Product List
    updateProducts()
    
    // Product Modifiers
    const modifiersArray = document.querySelectorAll('[modifiers]')
    buttonsArray.push(modifiersArray)

    // Window's Button Group
    const minus = identifyMainButton('btnMinus')
    minus.onclick = e => remote.BrowserWindow.getFocusedWindow().minimize()

    const plus = identifyMainButton('btnPlus') 
    plus.onclick = e => {
        remote.BrowserWindow.getFocusedWindow().isMaximized() ?
        remote.BrowserWindow.getFocusedWindow().restore() :
        remote.BrowserWindow.getFocusedWindow().maximize()
    }

    const cancel = identifyMainButton('btnCancel')
    cancel.onclick = e => remote.BrowserWindow.getFocusedWindow().close()

    // Erase Search Button
    const eraseButton = identifyMainButton('eraseButton')
    const mainSearch = identifyMainButton('search')
    eraseButton.onclick = e => {
        mainSearch.value = ''
        updateProducts()
    }

    // Add Product Button
    const addButton = identifyMainButton('addProduct')
    const editMenu = document.getElementById('editMenu')
    addButton.onclick = e => {
        editMenu.style.display = 'block'
        document.getElementById('inputName').focus()
        document.getElementById('editLabel').innerHTML = 'Adicionar Produto'
        disableButton(true, buttonsArray)
        onEditShortcut()
    }

    // Close Edit Menu Button
    const closeEditButton = document.getElementById('cancelProduct')
    closeEditButton.onclick = e => {
        closeEditMenu()
    }

    // Confirm Button
    const confirmButton = document.getElementById('confirmButton')
    confirmButton.onclick = e => {
        confirm()
    }

    // Search Button
    mainSearch.addEventListener('input', e => {
        const jsonProducts = readableProducts()

        terms = mainSearch.value.trim().toLowerCase()
        search(terms, jsonProducts)
    }) 

})