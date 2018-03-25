import puppeteer from "puppeteer"
import mongoose from "mongoose"
import JobModal, { JobModel } from "../../models/job"
import fs from "fs"

mongoose.connect("mongodb://localhost/lagou")

const POSITION_ITEM = "#s_position_list > ul > li"

main()

const sleep = (time: number) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve(), time)
    })
}

const getPageJobs = async (page: puppeteer.Page) => {
    const jobInfo = await page.evaluate((positionSelector: string) => {
        const positionArr: Array<Partial<JobModel>> = []
        document.querySelectorAll(positionSelector).forEach((position: HTMLElement) => {
            const {
                positionid,
                salary,
                company,
                positionname,
            } = position.dataset

            const addressElement = position.querySelector(".list_item_top > div.position > div.p_top > a > span > em")
            const address = addressElement.innerHTML

            const salaryExpEduElement: HTMLElement = position.querySelector(".list_item_top > div.position > div.p_bot > div")
            const arr = salaryExpEduElement.innerText.split(" ")
            const experience = arr[1] || ""
            const education = arr[3] || ""

            const tagsElement = [...position.querySelectorAll(".list_item_bot > div.li_b_l > span")]
            const tags = tagsElement.map(item => item.innerHTML)

            const companyIndustryElement = position.querySelector(".list_item_top > div.company > div.industry")
            const company_industry = companyIndustryElement.innerHTML.trim()

            const companyDescriptionElement = position.querySelector(".list_item_bot > div.li_b_r")
            const company_description = companyDescriptionElement.innerHTML.trim()

            positionArr.push({
                position_id: Number(positionid),
                name: positionname,
                address,
                salary: salary.split("-").map(item => parseInt(item, 10)) as [number, number],
                experience,
                education,
                tags,
                company,
                company_description,
                company_industry,
            })
        })

        return positionArr
    }, POSITION_ITEM)
    return jobInfo
}

async function main() {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: false
    })

    const curPage = await browser.newPage()
    await curPage.goto("https://www.lagou.com/zhaopin/webqianduan/?labelWords=label")
    let i = 30
    while ( i > 0) {
        const curPageJobs = await getPageJobs(curPage)
        curPageJobs.forEach( async (jobValue: Partial<JobModel>) => {
            const job = await JobModal.findOne({position_id: jobValue.position_id })
            if (job) {
                await job.update(jobValue)
            } else {
                const newJob = new JobModal(jobValue)
                await newJob.save()
            }
        })
        const nextPageURL = await curPage.$("#s_position_list > div.item_con_pager > div > a:nth-last-child(1)")
        await sleep(6000 + Math.random() * 10000)
        await Promise.all([
            nextPageURL.click(),
            curPage.waitForNavigation(),
        ])
        i--
    }
    await browser.close()
    mongoose.disconnect()
}
