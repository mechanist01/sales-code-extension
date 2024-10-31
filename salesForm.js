import { createAndDownloadFiles } from './audioFile.js';
export function createSalesForm({ dialogueBox, uploadButton, startButton }, micChunks, tabChunks, handleCall, show = true) {
    console.log('Creating sales form...');

    // Remove any existing input container
    const existingInputContainer = document.querySelector('.input-container');
    if (existingInputContainer) {
        existingInputContainer.remove();
    }

    // Create the input container
    const inputContainer = document.createElement('div');
    inputContainer.classList.add('input-container');
    console.log('Input container created');

    // Add this style immediately to ensure visibility
    inputContainer.style.opacity = '0';
    inputContainer.style.display = 'block';
    inputContainer.style.position = 'relative';
    inputContainer.style.zIndex = '1000';

    // Create form elements with consistent styling
    const formElements = [
        {
            type: 'select',
            id: 'repDropdown',
            options: [
                { value: 'Ryan', text: 'Ryan' },
                { value: 'Jay', text: 'Jay' }
            ],
            placeholder: 'Select representative'
        },
        {
            type: 'input',
            id: 'customerInput',
            placeholder: 'Enter customer name'
        },
        {
            type: 'select',
            id: 'saleStatusDropdown',
            options: [
                { value: 'Sold', text: 'Sold' },
                { value: 'No Sale', text: 'No Sale' }
            ],
            placeholder: 'Select sale status'
        },
        {
            type: 'input',
            id: 'saleAmountInput',
            placeholder: 'Sale amount',
            type: 'number'
        },
        {
            type: 'select',
            id: 'brandDropdown',
            options: [
                { value: 'Vitality Now', text: 'Vitality Now' },
                { value: 'Nooro', text: 'Nooro' }
            ],
            placeholder: 'Select brand'
        },
        {
            type: 'select',
            id: 'productsDropdown',
            options: [
                { value: 'Youthful Brain', text: 'Youthful Brain' },
                { value: 'Nail Exodus', text: 'Nail Exodus' }
            ],
            placeholder: 'Select product'
        }
    ];

    // Create and append form elements
    formElements.forEach(element => {
        const container = document.createElement('div');
        container.style.marginBottom = '15px';

        if (element.type === 'select') {
            const select = document.createElement('select');
            select.id = element.id;
            
            // Add default option
            const defaultOption = new Option(element.placeholder, '');
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.add(defaultOption);

            // Add other options
            element.options.forEach(opt => {
                select.add(new Option(opt.text, opt.value));
            });

            container.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.id = element.id;
            input.type = element.type || 'text';
            input.placeholder = element.placeholder;
            container.appendChild(input);
        }

        inputContainer.appendChild(container);
    });

    // Insert the form after the dialogue box
    if (dialogueBox && dialogueBox.parentNode) {
        dialogueBox.parentNode.insertBefore(inputContainer, dialogueBox.nextSibling);
        console.log('Form inserted into DOM');

        // Trigger reflow and add visibility
        setTimeout(() => {
            inputContainer.style.opacity = '1';
            inputContainer.classList.add('visible');
        }, 50);
    }

    // Update the upload button text
    if (uploadButton) {
        uploadButton.textContent = 'Send';
    }

    return inputContainer;
}