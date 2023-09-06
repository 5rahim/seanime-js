"use client"
import { Slider } from "@/components/shared/slider"

export default function Page() {

    return (
        <div className={"px-4 pt-8 space-y-10"}>
            <h2>Trending now</h2>
            <Slider id={"name"}>
                <div className={"w-[300px] h-[200px] bg-gray-700 flex-none"}></div>
                <div className={"w-[300px] h-[200px] bg-gray-700 flex-none"}></div>
                <div className={"w-[300px] h-[200px] bg-gray-700 flex-none"}></div>
                <div className={"w-[300px] h-[200px] bg-gray-700 flex-none"}></div>
                <div className={"w-[300px] h-[200px] bg-gray-700 flex-none"}></div>
                <div className={"w-[300px] h-[200px] bg-gray-700 flex-none"}></div>
                <div className={"w-[300px] h-[200px] bg-gray-700 flex-none"}></div>
                <div className={"w-[300px] h-[200px] bg-gray-700 flex-none"}></div>
                <div className={"w-[300px] h-[200px] bg-gray-700 flex-none"}></div>
                <div className={"w-[300px] h-[200px] bg-gray-700 flex-none"}></div>
            </Slider>
            <h2>Popular shows</h2>
            <h2>Popular genres</h2>
        </div>
    )
}
