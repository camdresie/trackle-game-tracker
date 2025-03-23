
import React, { useEffect, useRef } from 'react';

interface AdSenseProps {
  className?: string;
  style?: React.CSSProperties;
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  fullWidthResponsive?: boolean;
}

const AdSense: React.FC<AdSenseProps> = ({
  className = '',
  style = {},
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
}) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // If window.adsbygoogle is not defined yet, create it
      if (!window.adsbygoogle) {
        window.adsbygoogle = window.adsbygoogle || [];
      }
      
      // Push the ad to adsbygoogle for rendering
      window.adsbygoogle.push({});
    } catch (error) {
      console.error('Error loading AdSense ad:', error);
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default AdSense;
