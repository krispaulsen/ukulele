// customize material-tailwind components here

const myTheme = {
    accordion: {
        defaultProps: {
            icon: undefined,
            className: "",
            animate: {
                unmount: {},
                mount: {},
            },
            disabled: false,
        },
        styles: {
            base: {
                container: {
                    display: "block",
                    position: "relative",
                    width: "w-full",
                    borderWidth: "border",
                    borderRadius: "rounded-lg",
                    borderColor: "border-taupe-300",
                },
                header: {
                    initial: {
                        width: "w-full",
                        px: "px-2",
                        py: "py-2",
                        borderWidth: "border-none",
                        color: "text-orange-300",
                        fontFamily: "font-sans",
                        fontSize: "text-base",
                        lineHeight: "leading-none",
                        userSelect: "select-none",
                        hover: "hover:text-orange-400",
                        transition: "transition-colors",
                    },
                    active: { color: "text-orange-300" },
                    icon: {
                        ml: "ml-4",
                    },
                },
                body: {
                    display: "block",
                    width: "w-full",
                    py: "py-4",
                    color: "text-fg-base",
                    fontSmoothing: "antialiased",
                    fontFamily: "font-sans",
                    fontSize: "text-sm",
                    fontWeight: "font-light",
                    lineHeight: "leading-normal",
                },
                disabled: {
                    pointerEvents: "pointer-events-none",
                    opacity: "opacity-50",
                },
            },
        },
    },
    button: {
        defaultProps: {
            variant: "filled",
            color: "primary",
        },
        valid: {
            colors: [
                "primary",
                "secondary",
            ]
        },
        styles: {
            base: {
                initial: {
                    borderRadius: "rounded-lg", // Standardizes button corners
                    fontWeight: "font-normal",
                    textTransform: "normal-case",
                    cursor: "cursor-pointer",
                },
            },
            sizes: {
                sm: {
                    fontSize: "text-sm leading-none",
                    py: "py-1",
                    px: "px-2",
                    borderRadius: "rounded-lg",
                },
                md: {
                    fontSize: "text-base leading-none",
                    py: "py-2",
                    px: "px-4",
                    borderRadius: "rounded-lg",
                },
                lg: {
                    fontSize: "text-lg leading-none",
                    py: "py-4",
                    px: "px-8",
                    borderRadius: "rounded-lg",
                },
            },
            variants: {
                filled: {
                    primary: {
                        background: "bg-teal-950",
                        color: "text-fg-base",
                        hover: "hover:bg-teal-900",
                        // shadow,
                        // focus,
                        // active
                    },
                    secondary: {
                        background: "bg-amber-900",
                        color: "text-fg-base",
                        hover: "hover:bg-amber-800",
                    }
                }
            }
        },
    },
    iconButton: {
        defaultProps: {
            // variant: "filled",
            // size: "md",
            color: "primary",
            // fullWidth: false,
            ripple: false,
            // className: "",
        },
        valid: {
            colors: [ "primary", "secondary" ]
        },
        styles: {
            base: {
                cursor: "cursor-pointer"
            },
            sizes: {
                sm: {
                    width: "w-8",
                    height: "h-8",
                    fontSize: "text-sm",
                    borderRadius: "rounded-lg",
                },
                md: {
                    width: "w-10",
                    height: "h-10",
                    fontSize: "text-base",
                    borderRadius: "rounded-lg",
                },
                lg: {
                    width: "w-12",
                    height: "h-12",
                    fontSize: "text-lg",
                    borderRadius: "rounded-lg",
                },
            },
            variants: {
                filled: {
                    primary: {
                        background: "bg-teal-950",
                        color: "text-fg-base",
                        hover: "hover:bg-teal-900"
                    },
                    secondary: {
                        background: "bg-amber-900",
                        color: "text-fg-base",
                        hover: "hover:bg-amber-800"
                    }
                },
                outlined: {
                    primary: {
                        border: "border border-teal-950",
                        color: "text-teal-950",
                    },
                    secondary: {
                        border: "border border-amber-900",
                        color: "text-amber-900",
                        hover: "hover:bg-amber-700/20"
                    }
                }
            }
        }
    }
    // collapse: {
    //     defaultProps: {
    //         animate: {
    //             unmount: {},
    //             mount: {},
    //         },
    //         className: "",
    //     },
    //     styles: {
    //         base: {
    //             display: "block",
    //             width: "w-full",
    //             basis: "basis-full",
    //             overflow: "overflow-hidden",
    //         },
    //     },
    // },
};

export default myTheme;