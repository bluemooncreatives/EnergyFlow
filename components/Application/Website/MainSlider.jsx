'use client'
import Image from 'next/image'
import heroCenter from '@/public/assets/images/visual1.png'
import heroLeft from '@/public/assets/images/banner1.png'
import heroRight from '@/public/assets/images/banner2.png'

const MainSlider = () => {
    return (
        <section className='w-full bg-[var(--brand-primary-hover)] text-white'>
            <div className='relative flex items-center justify-center h-screen'>

                {/* top-left small image */}
                <div className='absolute top-6 left-6 w-36 h-36 overflow-hidden'>
                    <Image src={heroLeft.src} width={heroLeft.width} height={heroLeft.height} alt='top left' className='object-cover w-full h-full' />
                </div>

                {/* right middle image */}
                <div className='absolute right-6 top-1/2 -translate-y-1/2 w-36 h-36 overflow-hidden'>
                    <Image src={heroRight.src} width={heroRight.width} height={heroRight.height} alt='right middle' className='object-cover w-full h-full' />
                </div>

                {/* center image overlaying bottom brand text */}
                <div className='absolute bottom-[-60px] left-1/2 -translate-x-1/2 z-10'>
                    <h1 className='text-[197px] text-white'>ENERGYFLOW</h1>
                </div>

                <div className='absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-[20%] z-20 w-[380px] h-[480px] overflow-hidden'>
                    <Image src={heroCenter.src} width={heroCenter.width} height={heroCenter.height} alt='center' className='object-cover w-full h-full' />
                </div>

            </div>
        </section>
    )
}

export default MainSlider