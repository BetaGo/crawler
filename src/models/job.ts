import mongoose from "mongoose"

export type JobModel = mongoose.Document & {
    name: string,
    position_id: number,
    city: string,
    address: string,
    salary: [number, number],
    experience: string,
    education: string,
    tags: Array<string>,
    company: string,
    company_description: string,
    company_industry: string,
}

const jobSchema = new mongoose.Schema({
    name: String,
    position_id: Number,
    city: String,
    address: String,
    salary: [Number, Number],
    experience: String,
    education: String,
    tags: [String],
    company: String,
    company_description: String,
    company_industry: String,
})

const Job = mongoose.model("Job", jobSchema)

export default Job