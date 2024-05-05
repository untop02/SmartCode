## Smart Code

Smart Code is a code writing assistant for Visual Studio Code. 
Smart Code is meant to connect to your own LLM server, so that your code never leaves your own network.

## How to Install Smart Code

1. **Download the VSIX File**:
   - Start by downloading the VSIX file from the /dist folder.

2. **Open Visual Studio Code**:
   - Launch VSCode on your computer.

3. **Access the Extensions View**:
   - Open the Extensions view by clicking on the square icon on the left sidebar or by pressing `Ctrl+Shift+X` on your keyboard.

4. **Access More Actions**:
   - Click on the ellipsis (...) icon in the Extensions view to access more actions.

5. **Install from VSIX**:
   - From the dropdown menu, select "Install from VSIX..."

6. **Select the VSIX File**:
   - Navigate to the location where you downloaded the VSIX file and select it.

7. **Install the Extension**:
   - Click on the "Install" button to install the extension.

8. **Restart VSCode (If Required)**:
   - Restart VSCode for the changes to take effect. If prompted, click on the "Restart" button.

9. **Confirmation**:
   - Once installed, you'll typically receive a confirmation message. You can also verify the installation by checking if the extension appears in the Extensions view.

10. **Start Using the Extension**:
    - Now you can start using the extension and enjoy its features within Visual Studio Code!

    
# Packaging Your Repository into a VSIX File using VSCE

This guide will walk you through the process of packaging our repository's files into a VSIX file using VSCE (Visual Studio Code Extensions).

## Installation

If you haven't installed `vsce` globally yet, you can do so using npm:

```bash
npm install -g vsce
```

## Packaging Your Extension

1. **Clone the Smart Code repository:**

   ```bash
   git clone https://github.com/untop02/SmartCode
   ```

2. **Navigate into your repository's directory:**

   ```bash
   cd filepath
   ```

3. **Ensure all necessary files for your extension are in place.**

4. **Update the `package.json` file:**

   Ensure that the `name`, `version`, and other necessary fields are correctly set in your `package.json`.

5. **Package your extension using `vsce`:**

   Run the following command to package your extension:

   ```bash
   vsce package
   ```

   This command will create a `.vsix` file in the root directory of your directory.

6. **Congratulations!**

   Your extension is now packaged into a VSIX file and is ready for distribution.

## Resources

- [VS Code Extension Guidelines](https://code.visualstudio.com/api)
- [VSCE Documentation](https://github.com/microsoft/vscode-vsce)

## License

This project is licensed under the [MIT License](LICENSE).
