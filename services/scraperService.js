const axios = require('axios');
const { tiktok: dyluxTikTok, facebook: dyluxFacebook, twitter: dyluxTwitter, ytv, yta } = require('api-dylux');

const httpClient = axios.create({
    timeout: 20000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
});

async function resolveFinalUrl(url) {
    try {
        const res = await httpClient.get(url, { maxRedirects: 10 });
        return res.request.res.responseUrl || url;
    } catch {
        return url;
    }
}

async function scrapeTikTok(url) {
    let finalUrl = url;
    if (!url.includes('tiktok.com/@')) {
        finalUrl = await resolveFinalUrl(url);
    }

    try {
        const result = await dyluxTikTok(finalUrl);
        if (result && result.result) {
            const info = result.result;
            const videoUrl = info.play || info.wmplay;
            if (videoUrl) {
                return {
                    success: true,
                    url: videoUrl,
                    title: info.title || 'TikTok Video',
                    type: 'video'
                };
            }
        }
    } catch (err) {
        console.error('[TikTok dylux error]', err.message || err);
    }

    try {
        const res = await axios.post('https://www.tikwm.com/api/', new URLSearchParams({ url: finalUrl, hd: '1' }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 15000
        });
        const data = res.data;
        if (data && data.code === 0 && data.data) {
            const videoUrl = data.data.play || data.data.wmplay;
            if (videoUrl) {
                return {
                    success: true,
                    url: videoUrl,
                    title: data.data.title || 'TikTok Video',
                    type: 'video'
                };
            }
        }
    } catch (err) {
        console.error('[TikTok tikwm error]', err.message);
    }

    throw new Error('TikTok download failed');
}

async function scrapeInstagram(url) {
    const cleanUrl = url.split('?')[0].replace(/\/$/, '');

    try {
        const pageRes = await httpClient.get(cleanUrl, {
            headers: { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' }
        });
        const html = pageRes.data;

        const videoMatch = html.match(/<meta[^>]+property="og:video(?::secure_url)?"[^>]+content="([^"]+)"/i) ||
                           html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:video(?::secure_url)?"/i);
        if (videoMatch) {
            return {
                success: true,
                url: videoMatch[1].replace(/&amp;/g, '&'),
                title: 'Instagram Video',
                type: 'video'
            };
        }

        const imgMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ||
                         html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
        if (imgMatch) {
            return {
                success: true,
                url: imgMatch[1].replace(/&amp;/g, '&'),
                title: 'Instagram Image',
                type: 'image'
            };
        }
    } catch (err) {
        console.error('[Instagram OG error]', err.message);
    }

    try {
        const res = await axios.post('https://instafinsta.com/wp-json/aio-dl/video-data/', new URLSearchParams({ url: cleanUrl }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://instafinsta.com/'
            },
            timeout: 15000
        });
        if (res.data && res.data.medias && res.data.medias.length > 0) {
            const media = res.data.medias[0];
            return {
                success: true,
                url: media.url,
                title: res.data.title || 'Instagram Media',
                type: media.extension === 'mp4' ? 'video' : 'image'
            };
        }
    } catch (err) {
        console.error('[Instagram instafinsta error]', err.message);
    }

    try {
        const res2 = await axios.post('https://saveig.app/api/ajaxSearch', new URLSearchParams({ q: cleanUrl, t: 'media', lang: 'en' }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://saveig.app/'
            },
            timeout: 15000
        });
        if (res2.data && res2.data.data) {
            const html = res2.data.data;
            const videoMatch = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/);
            if (videoMatch) return { success: true, url: videoMatch[1].replace(/&amp;/g, '&'), title: 'Instagram Video', type: 'video' };
            const imgMatch = html.match(/src="(https:\/\/[^"]*scontent[^"]+\.jpg[^"]*)"/);
            if (imgMatch) return { success: true, url: imgMatch[1].replace(/&amp;/g, '&'), title: 'Instagram Image', type: 'image' };
        }
    } catch (err) {
        console.error('[Instagram saveig error]', err.message);
    }

    throw new Error('Instagram download failed');
}

async function scrapeFacebook(url) {
    let finalUrl = url;
    if (url.includes('fb.watch') || !url.includes('facebook.com/')) {
        finalUrl = await resolveFinalUrl(url);
    }

    try {
        const result = await dyluxFacebook(finalUrl);
        if (result && (result.hd || result.sd)) {
            return {
                success: true,
                url: result.hd || result.sd,
                title: result.title || 'Facebook Video',
                type: 'video'
            };
        }
    } catch (err) {
        console.error('[Facebook dylux error]', err.message || err);
    }

    try {
        const res = await httpClient.get(finalUrl, {
            headers: {
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Sec-Fetch-Mode': 'navigate'
            }
        });
        const html = res.data;
        const hdMatch = html.match(/"browser_native_hd_url"\s*:\s*"([^"]+)"/) ||
                        html.match(/hd_src\s*:\s*"([^"]+)"/) ||
                        html.match(/"playbackUrl"\s*:\s*"([^"]+)"/);
        const sdMatch = html.match(/"browser_native_sd_url"\s*:\s*"([^"]+)"/) ||
                        html.match(/sd_src\s*:\s*"([^"]+)"/);
        const videoUrl = hdMatch ? hdMatch[1] : (sdMatch ? sdMatch[1] : null);
        if (videoUrl) {
            return {
                success: true,
                url: videoUrl.replace(/\\u002F/g, '/').replace(/\\u0026/g, '&').replace(/\\/g, ''),
                title: 'Facebook Video',
                type: 'video'
            };
        }
    } catch (err) {
        console.error('[Facebook direct error]', err.message);
    }

    try {
        const mRes = await httpClient.get(finalUrl.replace('www.facebook.com', 'm.facebook.com'), {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' }
        });
        const mHtml = mRes.data;
        const match = mHtml.match(/<video[^>]+src="([^"]+)"/i);
        if (match) {
            return { success: true, url: match[1].replace(/&amp;/g, '&'), title: 'Facebook Video', type: 'video' };
        }
    } catch (err) {
        console.error('[Facebook mobile error]', err.message);
    }

    throw new Error('Facebook video not found');
}

async function scrapeTwitter(url) {
    const idMatch = url.match(/status\/(\d+)/);
    if (!idMatch) throw new Error('Twitter media not found');
    const tweetId = idMatch[1];

    try {
        const result = await dyluxTwitter(url);
        if (result && result.desc && result.desc.length > 0) {
            if (result.audio && result.audio !== 'https://twdown.net/undefined') {
                return { success: true, url: result.audio, title: result.desc || 'Twitter Video', type: 'video' };
            }
        }
    } catch (err) {
        console.error('[Twitter dylux error]', err.message || err);
    }

    try {
        const res = await axios.get(`https://api.fxtwitter.com/status/${tweetId}`, {
            headers: { 'User-Agent': 'Twitterbot/1.0' },
            timeout: 12000
        });
        const tweet = res.data && res.data.tweet;
        if (tweet && tweet.media) {
            if (tweet.media.videos && tweet.media.videos.length > 0) {
                const video = tweet.media.videos[0];
                const variants = video.variants || [];
                const mp4s = variants.filter(v => v.content_type === 'video/mp4');
                mp4s.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                const videoUrl = mp4s.length > 0 ? mp4s[0].url : video.url;
                return { success: true, url: videoUrl, title: tweet.text || 'Twitter Video', type: 'video' };
            }
            if (tweet.media.photos && tweet.media.photos.length > 0) {
                return { success: true, url: tweet.media.photos[0].url, title: tweet.text || 'Twitter Image', type: 'image' };
            }
        }
    } catch (err) {
        console.error('[Twitter fxtwitter error]', err.message);
    }

    try {
        const synRes = await axios.get(`https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=a`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        const data = synRes.data;
        if (data && data.video) {
            const variants = data.video.variants || [];
            const mp4s = variants.filter(v => v.content_type === 'video/mp4');
            mp4s.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
            if (mp4s.length > 0) return { success: true, url: mp4s[0].url, title: data.text || 'Twitter Video', type: 'video' };
        }
        if (data && data.photos && data.photos.length > 0) {
            return { success: true, url: data.photos[0].url, title: data.text || 'Twitter Image', type: 'image' };
        }
    } catch (err) {
        console.error('[Twitter syndication error]', err.message);
    }

    throw new Error('Twitter media not found');
}

async function scrapeReddit(url) {
    const cleanUrl = url.split('?')[0].replace(/\/$/, '');

    const redditHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
    };

    const jsonUrls = [
        cleanUrl + '.json',
        cleanUrl.replace('www.reddit.com', 'old.reddit.com') + '.json'
    ];

    for (const jsonUrl of jsonUrls) {
        try {
            const res = await axios.get(jsonUrl, { headers: redditHeaders, timeout: 12000 });
            const post = res.data[0].data.children[0].data;

            if (post.is_video && post.media && post.media.reddit_video) {
                return {
                    success: true,
                    url: post.media.reddit_video.fallback_url.split('?')[0],
                    title: post.title || 'Reddit Video',
                    type: 'video'
                };
            }

            if (post.url_overridden_by_dest) {
                const mediaUrl = post.url_overridden_by_dest;
                if (/\.(mp4|webm)(\?|$)/i.test(mediaUrl)) {
                    return { success: true, url: mediaUrl, title: post.title || 'Reddit Video', type: 'video' };
                }
                if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(mediaUrl)) {
                    return { success: true, url: mediaUrl, title: post.title || 'Reddit Image', type: 'image' };
                }
            }

            if (post.preview && post.preview.images && post.preview.images.length > 0) {
                const imgUrl = post.preview.images[0].source.url.replace(/&amp;/g, '&');
                return { success: true, url: imgUrl, title: post.title || 'Reddit Image', type: 'image' };
            }

            if (post.gallery_data && post.media_metadata) {
                const firstKey = Object.keys(post.media_metadata)[0];
                const imgData = post.media_metadata[firstKey];
                if (imgData.s && imgData.s.u) {
                    return { success: true, url: imgData.s.u.replace(/&amp;/g, '&'), title: post.title || 'Reddit Image', type: 'image' };
                }
            }
        } catch (err) {
            console.error('[Reddit json error]', jsonUrl.substring(0, 60), err.message);
        }
    }

    throw new Error('Reddit media not found');
}

async function scrapeKwai(url) {
    let finalUrl = url;
    try { finalUrl = await resolveFinalUrl(url); } catch {}

    try {
        const res = await httpClient.get(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            }
        });
        const html = res.data;
        const patterns = [
            /"mainMvUrls"\s*:\s*\[\s*\{[^}]*"url"\s*:\s*"([^"]+)"/,
            /"photoH265Url"\s*:\s*"([^"]+)"/,
            /"playUrl"\s*:\s*"([^"]+)"/,
            /"srcUrl"\s*:\s*"([^"]+)"/,
            /src="(https?:\/\/[^"]+\.mp4[^"]*)"/
        ];
        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                const cleanUrl = match[1].replace(/\\u002F/g, '/').replace(/\\u0026/g, '&').replace(/\\/g, '');
                if (cleanUrl.startsWith('http')) {
                    return { success: true, url: cleanUrl, title: 'Kwai Video', type: 'video' };
                }
            }
        }
    } catch (err) {
        console.error('[Kwai page error]', err.message);
    }

    try {
        const idMatch = finalUrl.match(/video\/(\d+)/) || finalUrl.match(/short-video\/(\d+)/);
        if (idMatch) {
            const kwaiRes = await axios.post('https://www.kwai.com/rest/o/w/pc/video/detail', {
                photoId: idMatch[1],
                fid: idMatch[1]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': 'https://www.kwai.com/'
                },
                timeout: 12000
            });
            const d = kwaiRes.data;
            if (d && d.data && d.data.photo) {
                const photo = d.data.photo;
                const videoUrl = (photo.mainMvUrls && photo.mainMvUrls[0] && photo.mainMvUrls[0].url) || photo.photoUrl;
                if (videoUrl) return { success: true, url: videoUrl, title: photo.caption || 'Kwai Video', type: 'video' };
            }
        }
    } catch (err) {
        console.error('[Kwai api error]', err.message);
    }

    throw new Error('Kwai video not found');
}

async function downloadYouTube(url, isAudio) {
    if (isAudio) {
        const res = await yta(url);
        if (res && res.dl_url) {
            return { success: true, url: res.dl_url, title: res.title || 'YouTube Audio', type: 'audio' };
        }
        throw new Error('Falha ao processar a extração.');
    }

    const qualities = ['720p', '480p', '360p', '240p', '144p'];
    const { ytv: ytvFn } = require('api-dylux');

    for (const quality of qualities) {
        try {
            const res = await ytvFn(url, quality);
            if (res && res.dl_url) {
                return { success: true, url: res.dl_url, title: res.title || 'YouTube Video', type: 'video' };
            }
        } catch (err) {
            console.error(`[YouTube ${quality} error]`, err.message || err);
        }
    }
    throw new Error('Falha ao processar a extração.');
}

module.exports = {
    scrapeTikTok,
    scrapeInstagram,
    scrapeFacebook,
    scrapeTwitter,
    scrapeReddit,
    scrapeKwai,
    downloadYouTube
};
