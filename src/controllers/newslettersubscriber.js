const {PrismaClient}=require("../../generated/prisma");

const prisma = new PrismaClient();

const Createnewslettersubscriber = async (req, res) => {
  const { EmailAddress } = req.body;

  if (!EmailAddress) {
    return res.status(400).json({ msg: "Email address is required." });
  }

  try {
    
    const existingSubscriber = await prisma.tbl_newslettersubscriber.findUnique({
      where: { EmailAddress },
    });

    
    if (existingSubscriber) {
      return res.status(409).json({
        msg: "This email is already subscribed to the newsletter.",
      });
    }

    
    const newSubscriber = await prisma.tbl_newslettersubscriber.create({
      data: { EmailAddress },
    });

    return res.status(201).json({
      msg: "Newsletter subscriber created successfully",
      newslettersub: newSubscriber,
    });
  } catch (err) {
    console.error("Create newsletter subscriber error:", err.message);
    return res.status(500).send(
      "Server Error during newsletter subscription creation"
    );
  }
};


const getallnewsletter =async (req,res)=>{
    try{
        const newsletters = await prisma.tbl_newslettersubscriber.findMany({
            orderBy:{createdAt:'desc'},
        });
        res.json(newsletters);
    }catch(err){
        console.error('Get newsletter subscriber error:',err.message);
        res.status(500).send('Server Error');
    }
};

// const deletenewsletter=async (req,res)=>{
//     const {id}=req.params;
//     try{
//         await prisma.tbl_newslettersubscriber.delete({
//             where :{NLSubID:id},
//         });
//         res.json({msg :'newsletter subscriber deleted successfully'});
//     }catch(err){
//         if(err.code === 'P2025'){
//             return res.status(404).json({ msg: 'Newsletter subscriber not found for deletion.' });
//         }
//         console.error('Delete newsletter subscriber error:', err.message);
//         res.status(500).send('Server Error during newsletter subscription deletion');
//     }
// };


const deleteManyNewsletters = async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ msg: "An array of IDs is required." });
  }

  try {
    const result = await prisma.tbl_newslettersubscriber.deleteMany({
      where: {
        NLSubID: {
          in: ids,
        },
      },
    });
    res.json({ msg: `${result.count} newsletter subscriber(s) deleted successfully` });
  } catch (err) {
    console.error('Bulk delete newsletter subscriber error:', err.message);
    res.status(500).send('Server Error during bulk deletion');
  }
};

module.exports = {Createnewslettersubscriber,getallnewsletter,deleteManyNewsletters };