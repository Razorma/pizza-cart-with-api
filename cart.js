document.addEventListener('alpine:init', () => {
    Alpine.data('AddToCart', () => {
        return {
            pizzas: [],
            id: 11921,
            cartId: "",
            username: "",
            loginMessage: "",
            showWarning: false,
            cartPizzas: [],
            cartTotal: 0,
            message: "",
            amount: "",
            featured:[],
            login() {
                if (this.username.length >= 3 && this.username.length <14) {
                    localStorage["username"] = this.username
                    this.createCart()
                    this.featured =[]
                    this.createFeatured(4)
                    this.createFeatured(8)
                    this.createFeatured(14)
                    this.getFeturedPizzas(this.username)
                    this.init()
                    
                } else {
                    this.loginMessage = "Username should be at least 3 characters and not more than 8 characters"
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
                    return axios.post(createFeaturedURL,{
                        "username" : this.username,
	                    "pizza_id" : number
                    })

            },
            getFeturedPizzas(username) {
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

                this.showCartData()
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
                                this.message = `Payment Successful! your change is R ${(this.amount - this.cartTotal).toFixed(2)}`;
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