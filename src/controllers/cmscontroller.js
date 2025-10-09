
const {PrismaClient} =require('../../generated/prisma');
const prisma = new PrismaClient();

const updateCms = async (req,res)=>{
    // const {CmsPageName,CmsText} = req.body;

    const { CmsPageName, CmsText_en, CmsText_es, CmsText_fr, CmsText_de, CmsText_zh } = req.body;

    if (!CmsPageName || !CmsText_en) {
        return res.status(400).json({ msg: 'CmsPageName and CmsText are required fields.' });
    }

    const data = {
        CmsText_en,
        CmsText_es,
        CmsText_fr,
        CmsText_de,
        CmsText_zh
    };

    try {
                const updatedCms = await prisma.tbl_cms.upsert({
                    where: { CmsPageName: CmsPageName },
                    update: data,
                    create: {
                        CmsPageName,
                        ...data,
                    },
        });

    //    const updatedCms = await prisma.tbl_cms.update({
    //         where: { CmsPageName: CmsPageName },
    //         data: data, // Use the prepared data object
    //     });


        res.status(200).json({ msg: 'Cms content updated successfully', cms: updatedCms });
    }
    catch (err) {
        console.error('Update CMS error:', err.message);
        res.status(500).send('Server Error during CMS update');
    }
};


const getCms= async(req,res)=>{
    try{
        const cmsEntries = await prisma.tbl_cms.findMany();
        res.json(cmsEntries);
    }catch(err){
        console.error('Get Cms error :',err.message);
        res.status(500).send('Server Error');
    }
};

const getCmsByPageName = async (req,res) =>{
        const {pageName}= req.params;
         const { lang } = req.query;
        try{
           const cmsEntry = await prisma.tbl_cms.findUnique({
            where: { CmsPageName: pageName },
            select: {
                CmsPageName: true,
                CmsText_en: true,
                CmsText_es: true,
                CmsText_fr: true,
                CmsText_de: true,
                CmsText_zh: true,
            }
        });

            if(!cmsEntry){
                 return res.status(404).json({ msg: 'CMS entry not found for that page name.' });
            }

            let cmsText;
            switch (lang) {
                case 'es': cmsText = cmsEntry.CmsText_es || cmsEntry.CmsText_en; break;
                case 'fr': cmsText = cmsEntry.CmsText_fr || cmsEntry.CmsText_en; break;
                case 'de': cmsText = cmsEntry.CmsText_de || cmsEntry.CmsText_en; break;
                case 'zh': cmsText = cmsEntry.CmsText_zh || cmsEntry.CmsText_en; break;
                default: cmsText = cmsEntry.CmsText_en;
            }

            res.json({
                CmsPageName: cmsEntry.CmsPageName,
                CmsText: cmsText,
            });

        }catch(err){
            console.error('Get CMS by name error:', err.message);
            res.status(500).send('Server Error');
        }
}

module.exports ={updateCms,getCms ,getCmsByPageName};