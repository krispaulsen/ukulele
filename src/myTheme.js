// customize material-tailwind components here

const myTheme = {
    button: {
        defaultProps: {
            color: "orange", // Sets your new brand color as the default for all buttons
            variant: "filled",
        },
        styles: {
            base: {
                initial: {
                    borderRadius: "rounded-lg", // Standardizes button corners
                },
            },
        },
    },
};

export default myTheme;