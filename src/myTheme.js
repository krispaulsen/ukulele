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
            ],
            variants: [
                "filled",
                "outlined",
                "link",
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
                    fontSize: "text-sm",
                    lineHeight: "leading-none",
                    py: "py-1",
                    px: "px-2",
                    borderRadius: "rounded-lg",
                },
                md: {
                    fontSize: "text-base",
                    lineHeight: "leading-none",
                    py: "py-2",
                    px: "px-4",
                    borderRadius: "rounded-lg",
                },
                lg: {
                    fontSize: "text-lg",
                    lineHeight: "leading-none",
                    py: "py-4",
                    px: "px-8",
                    borderRadius: "rounded-lg",
                },
            },
            variants: {
                filled: {
                    primary: {
                        background: "bg-amber-600 dark:bg-amber-900",
                        color: "dark:text-fg-base",
                        hover: "hover:bg-amber-500 dark:hover:bg-amber-800",
                        // shadow,
                        // focus,
                        // active
                    },
                    secondary: {
                        background: "bg-teal-600 dark:bg-teal-950",
                        color: "dark:text-fg-base",
                        hover: "hover:bg-teal-500 dark:hover:bg-teal-900",
                    }
                },
                outlined: {
                    primary: {
                        border: "border border-amber-600",
                        color: "text-amber-600",
                        hover: "hover:bg-amber-700/20"
                    },
                    secondary: {
                        border: "border border-teal-950 dark:border-teal-600",
                        color: "text-teal-950 dark:text-teal-600",
                        hover: "hover:bg-teal-500 dark:hover:bg-teal-900"
                    }
                },
                link: {
                    primary: {
                        display: "inline",
                        padding: "p-0",
                        background: "transparent",
                        color: "text-orange-800 dark:text-orange-300",
                        lineHeight: "leading-normal",
                        borderRadius: "rounded-none",
                        hover: "hover:text-orange-400 hover:underline",
                    },
                    secondary: {
                        display: "inline",
                        padding: "p-0",
                        background: "transparent",
                        color: "text-teal-600",
                        lineHeight: "leading-normal",
                        borderRadius: "rounded-none",
                        hover: "hover:text-teal-500 hover:underline",
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
                    width: "w-6",
                    height: "h-6",
                    fontSize: "text-xs",
                    borderRadius: "rounded-full",
                },
                md: {
                    width: "w-8",
                    height: "h-8",
                    fontSize: "text-base",
                    borderRadius: "rounded-lg",
                },
                lg: {
                    width: "w-12",
                    height: "h-12",
                    fontSize: "text-2xl",
                    borderRadius: "rounded-lg",
                },
            },
            variants: {
                filled: {
                    primary: {
                        background: "bg-amber-600 dark:bg-amber-900",
                        color: "dark:text-fg-base",
                        hover: "hover:bg-amber-500 dark:hover:bg-amber-800",
                    },
                    secondary: {
                        background: "bg-teal-600 dark:bg-teal-950",
                        color: "dark:text-fg-base",
                        hover: "hover:bg-teal-500 dark:hover:bg-teal-900",
                    }
                },
                outlined: {
                    primary: {
                        border: "border border-amber-600",
                        color: "text-amber-600",
                        hover: "hover:bg-amber-700/20"
                    },
                    secondary: {
                        border: "border border-teal-950 dark:border-teal-600",
                        color: "text-teal-950 dark:text-teal-600",
                        hover: "hover:bg-teal-500 dark:hover:bg-teal-900"
                    }
                }
            }
        }
    },
    // textarea: {
    //     styles: {
    //         base: {
    //             textarea: {
    //                 fontFamily: "font-mono"
    //             }
    //         }
    //     }
    // }
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