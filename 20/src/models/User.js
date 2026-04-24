const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, 'Имя обязательно'],
      trim: true,
    },
    last_name: {
      type: String,
      required: [true, 'Фамилия обязательна'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Возраст обязателен'],
      min: [0, 'Возраст не может быть отрицательным'],
    },
    created_at: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000),
    },
    updated_at: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000),
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

userSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updated_at: Math.floor(Date.now() / 1000) });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
