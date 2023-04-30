class HealthBar {
    constructor(x, y, w, h, maxHealth, color){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.maxHealth = maxHealth;
        this.maxWidth = w;
        this.color = color;
    }

    show(context){

    }

    updateHealth(val){
        if(val >= 0){
            this.health = val;
            this.w = (this.health/this.maxHealth) * this.maxWidth;
        }
    }
}