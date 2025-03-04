const { Schema, model } = require("mongoose");
const shopItemSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  role: { type: String, required: false },
  roleName: { type: String, required: false },
  quantity: { type: Number, required: false, default: -1 },
  description: { type: String, required: false },
  allowMultiplePurchases: { type: Boolean, required: false, default: false },
  blockchainId: { type: String, required: false },
  requiredRoleToPurchase: { type: String, required: false },
  requiredRoleToPurchaseName: { type: String, required: false },
  server: { type: Schema.Types.ObjectId, ref: "Guilds", required: false },
});

module.exports = model("ShopItem", shopItemSchema);
