const showModal = require("../../utils/modelHandler");

module.exports = {
  name: "social",
  description: "Add User Socials!",
  callback: async (client, interaction) => {
    const fieldOptions = [
      {
        label: "X Account Handle",
        customId: "x_account_handle",
        placeholder: "Enter Twitter Link",
        style: "Short",
        required: true,
      },
      {
        label: "TG Account Handle",
        customId: "tg_account_handle",
        placeholder: "Enter TG Link",
        style: "Short",
        required: false,
      },
      {
        label: "Youtube Account Handle",
        customId: "yt_account_handle",
        placeholder: "Enter YT Account Handle",
        style: "Short",
        required: false,
      },
      {
        label: "Tiktok Account Handle",
        customId: "tiktok_account_handle",
        placeholder: "Enter YT tiktok Handle",
        style: "Short",
        required: false,
      },
      {
        label: "Instagram Account Handle",
        customId: "ig_account_handle",
        placeholder: "Enter Instagram Handle",
        style: "Short",
        required: false,
      },
    ];

    await showModal(
      interaction,
      "Social Settings",
      "social_settings_modal",
      fieldOptions
    );
  },
};
