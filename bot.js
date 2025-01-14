const { Telegraf } = require('telegraf');
const TronWeb = require('tronweb');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// TRON API Configuration
const tronWeb = new TronWeb({
  fullHost: process.env.TRONGRID_API,
  headers: { "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY },
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Start Command
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const existingUser = await User.findOne({ userId });

  if (!existingUser) {
    const newUser = new User({ userId, referrals: [], balance: 0 });
    await newUser.save();
  }

  const referralLink = `https://t.me/${ctx.botInfo.username}?start=${userId}`;
  ctx.reply(`Welcome ${ctx.from.first_name}! Share your referral link to earn TRX: ${referralLink}`);
});

// Referral Logic
bot.command('refer', async (ctx) => {
  const userId = ctx.from.id;
  const referrerId = ctx.message.text.split(' ')[1];

  if (referrerId && referrerId !== userId) {
    const referrer = await User.findOne({ userId: referrerId });
    if (referrer) {
      referrer.referrals.push(userId);
      referrer.balance += 10; // Reward for referral (e.g., 10 TRX)
      await referrer.save();
      ctx.reply('You have been referred successfully!');
    }
  } else {
    ctx.reply('Invalid referral link.');
  }
});

// Withdraw TRX
bot.command('withdraw', async (ctx) => {
  const userId = ctx.from.id;
  const user = await User.findOne({ userId });

  if (user && user.balance > 0) {
    try {
      const tx = await tronWeb.trx.sendTransaction(
        'receiver_trx_address', // Replace with the user's wallet address
        tronWeb.toSun(user.balance), // Convert TRX to SUN
        'your_private_key' // Replace with your private key
      );

      user.balance = 0; // Reset balance after withdrawal
      await user.save();
      ctx.reply(`Withdrawal successful! Transaction ID: ${tx.txid}`);
    } catch (error) {
      console.error(error);
      ctx.reply('Error processing withdrawal.');
    }
  } else {
    ctx.reply('You have no balance to withdraw.');
  }
});

// Launch Bot
bot.launch();
console.log('Bot is running...');

