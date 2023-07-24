document.addEventListener('alpine:init', () => {
    Alpine.data('AddToCart', () => {
        return {
            pizzas: [],
            id: 11921,
            cartId: "",
            username: "",
            loginMessage: "",
            showWarning: false,
            showHistory: false,
            showHistoryData: false,
            cartPizzas: [],
            cartTotal: 0,
            message: "",
            amount: "",
            featured: [],
            usedCarts: [],
            historyError: "",
            purchaseHistory: JSON.parse(localStorage.getItem("purchaseHistory")) || [],
            login() {
                if (this.username.length >= 3 && this.username.length < 14) {
                    localStorage["username"] = this.username
                    this.createCart()
                    this.featured = []
                    this.createFeatured(4)
                    this.createFeatured(8)
                    this.createFeatured(14)
                    this.createFeatured(10)
                    axios.get("https://pizza-api.projectcodex.net/api/pizzas")
                        .then(result => {
                            this.pizzas = result.data.pizzas
                        })
                    if (this.username) {
                        this.getFeturedPizzas(this.username);
                    }
                    if (!this.cartId) {
                        this.createCart()
                    }
                    this.getFeturedPizzas(this.username)


                } else {
                    this.loginMessage = "Username should be at least 3 characters and not more than 14 characters"
                    setTimeout(() => {
                        this.loginMessage = ""
                    }, 3000)
                }

            },
            logout() {
                if (confirm("are you sure you want to logout")) {
                    this.username = "";
                    this.cartId = "";
                    localStorage["cartId"] = "";
                    localStorage["username"] = "";
                }

            },
            createCart() {
                if (!this.username) {
                    return Promise.resolve();
                }
                const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`
                const cartId = localStorage["cartId"]
                if (cartId) {
                    this.cartId = cartId
                } else {
                    return axios.get(createCartURL)
                        .then(result => {
                            this.cartId = result.data.cart_code;
                            localStorage["cartId"] = this.cartId
                        })
                }

            },
            createFeatured(number) {
                const createFeaturedURL = "https://pizza-api.projectcodex.net/api/pizzas/featured"
                return axios.post(createFeaturedURL, {
                    "username": this.username,
                    "pizza_id": number
                })

            },
            getFeturedPizzas(username) {
                axios.get("https://pizza-api.projectcodex.net/api/pizzas")
                    .then(result => {
                        this.pizzas = result.data.pizzas
                    })
                if (this.featured.length <= 3) {
                    return axios.get(`https://pizza-api.projectcodex.net/api/pizzas/featured?username=${username}`)
                        .then(result => {
                            this.featured = result.data.pizzas.slice(0, 3)
                        })
                }

            },
            getCart() {
                const cartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cartId}/get`
                return axios.get(cartURL)
            },
            getUsedCart(CartId) {
                const cartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${CartId}/get`
                axios.get(cartURL).then(result => {

                    this.usedCarts.push(result.data)
                })
            },
            computed: {
                purchaseHistoryByUsername() {
                    return this.purchaseHistory.filter(purchase => purchase.username === this.username);
                }
            },
            deletePurchaseHistory() {
                this.purchaseHistory = JSON.parse(localStorage.getItem("purchaseHistory")) || []
                this.purchaseHistory = this.purchaseHistory.filter(purchase => purchase.username !== this.username);
                localStorage.setItem("purchaseHistory", JSON.stringify(this.purchaseHistory));
                this.loadPurchaseHistory();
                this.showHistory = false
            },
            loadPurchaseHistory() {
                if (this.purchaseHistory.length === 0) {
                    this.historyError = "There is no avilable history"
                    setTimeout(() => {
                        this.historyError = ""
                        this.showHistory = false
                    }, 4000)
                }
                const storedPurchaseHistory = JSON.parse(localStorage.getItem("purchaseHistory")) || [];
                const loggedInUserPurchaseHistory = storedPurchaseHistory.filter(purchase => purchase.username === this.username);
                this.purchaseHistory = loggedInUserPurchaseHistory;
            },
            addPizza(pizzaId) {
                return axios.post("https://pizza-api.projectcodex.net/api/pizza-cart/add", {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                })
            },
            removePizza(pizzaId) {
                return axios.post("https://pizza-api.projectcodex.net/api/pizza-cart/remove", {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                })
            },
            payForPizza() {
                return axios.post("https://pizza-api.projectcodex.net/api/pizza-cart/pay", {
                    "cart_code": this.cartId,
                    "amount": this.amount
                })
            },
            showCartData() {
                this.getCart().then(result => {
                    const cartData = result.data
                    this.cartPizzas = cartData.pizzas
                    this.cartTotal = cartData.total.toFixed(2)
                })
            },
            init() {
                const storedUserName = localStorage["username"]
                if (storedUserName) {
                    this.username = storedUserName
                }

                this.loadPurchaseHistory();
                axios.get("https://pizza-api.projectcodex.net/api/pizzas")
                    .then(result => {
                        this.pizzas = result.data.pizzas
                    })
                if (this.username) {
                    this.getFeturedPizzas(this.username);
                }
                if (!this.cartId) {
                    this.createCart()
                }
                if (this.username) {
                    this.showCartData()
                }

            },
            addCurrentPizza(pizzaId) {
                this.addPizza(pizzaId)
                    .then(() => {
                        this.showCartData()
                    })
            },
            removeCurrentPizza(pizzaId) {
                this.removePizza(pizzaId)
                    .then(() => {
                        this.showCartData()
                    })
            },
            pay() {
                this.payForPizza()
                    .then(result => {
                        if (result.data.status === "failure") {
                            this.showWarning = true
                            this.message = result.data.message;
                            setTimeout(() => {
                                this.message = ""
                            }, 3000)
                        } else {
                            if (this.cartTotal > 0) {
                                this.showWarning = false
                                const newPurchase = {
                                    cartId: this.cartId,
                                    cartPizzas: this.cartPizzas,
                                    cartTotal: this.cartTotal,
                                    timestamp: new Date().toLocaleString(),
                                    username: this.username,
                                    paid: this.amount,
                                    change: (this.amount - this.cartTotal).toFixed(2),
                                };
                                const storedPurchaseHistory = JSON.parse(localStorage.getItem("purchaseHistory")) || [];
                                storedPurchaseHistory.push(newPurchase);
                                localStorage.setItem("purchaseHistory", JSON.stringify(storedPurchaseHistory));
                                this.message = `Payment Successful! your change is R ${(this.amount - this.cartTotal).toFixed(2)}`;
                                this.loadPurchaseHistory();
                                setTimeout(() => {
                                    this.message = "";
                                    this.cartId = "";
                                    this.cartPizzas = [];
                                    this.cartTotal = 0.00;
                                    this.amount = "";
                                    localStorage["cartId"] = ""
                                    this.createCart()
                                }, 3000)
                            }

                        }
                    })
            }
        }
    });
});