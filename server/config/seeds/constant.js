module.exports = {
  Admin: [{
    name: "Admin User",
    userName: "Admin",
    email: process.env.ADMIN_EMAIL,
    userType: 1,
    password: process.env.ADMIN_PASSWORD,
  }],
  userType: [
    {
      userType: "Admin",
      userTypeId: 1,
    },
    {
      userType: "Practitioner",
      userTypeId: 2,
    },
  ],
  allFlagReason:[
    {
      flagReason:"Irrelevant Content"
    },
    {
      flagReason:"Abusive Language"
    },
    {
      flagReason:"Fake Review"
    },
    {
      flagReason:"Other Issues"
    },
  ],
  configuration:[
    {
      name:"cronDays",
      displayName:"Number of days",
      metaDataInt:30,
      description:"Number of days after which documents delete from system"
    },
    {
      name:"practitioners",
      displayName:"Number of active practitioners",
      metaDataInt:5,
      description:"Number of active practitioners in the system at a time"
    }
  ]
};
