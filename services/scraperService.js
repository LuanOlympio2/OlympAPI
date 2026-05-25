const axios = require('axios');
const { downloadCobalt } = require('./cobaltService');

async function scrapeTikTok(url) {
    try {
        let finalUrl = url;
        if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com') || url.includes('t.tiktok.com') || url.includes('/t/')) {
            const headRes = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                maxRedirects: 5
            });
            finalUrl = headRes.request.res.responseUrl || url;
        }

        const videoIdMatch = finalUrl.match(/\/video\/(\d+)/) || finalUrl.match(/\/v\/(\d+)/);
        if (videoIdMatch) {
            const videoId = videoIdMatch[1];
            try {
                const pageRes = await axios.get(`https://www.tiktok.com/@placeholder/video/${videoId}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                const html = pageRes.data;
                const playAddrMatch = html.match(/"playAddr"\s*:\s*"([^"]+)"/);
                if (playAddrMatch) {
                    const cleanUrl = playAddrMatch[1].replace(/\\u002F/g, '/').replace(/\\u0026/g, '&');
                    return {
                        success: true,
                        url: cleanUrl,
                        title: 'TikTok Video',
                        type: 'video'
                    };
                }
            } catch (innerErr) {
                console.error(innerErr.message);
            }
        }

        try {
            const loveRes = await axios.post('https://lovetik.com/api/ajax/search', new URLSearchParams({ query: url }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (loveRes.data && loveRes.data.status === 'ok' && loveRes.data.links && loveRes.data.links.length > 0) {
                return {
                    success: true,
                    url: loveRes.data.links[0].a,
                    title: loveRes.data.title || 'TikTok Video',
                    type: 'video'
                };
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        try {
            const cobaltUrl = await downloadCobalt(url);
            if (cobaltUrl) {
                return {
                    success: true,
                    url: cobaltUrl,
                    title: 'TikTok Video',
                    type: 'video'
                };
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        throw new Error('TikTok download failed');
    } catch (err) {
        throw new Error(err.message);
    }
}

async function scrapeInstagram(url) {
    try {
        let cleanUrl = url.split('?')[0];
        try {
            const response = await axios.get(cleanUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
                }
            });
            const html = response.data;
            const videoMatch = html.match(/<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:video["']/i);
            if (videoMatch) {
                return {
                    success: true,
                    url: videoMatch[1].replace(/&amp;/g, '&'),
                    title: 'Instagram Video',
                    type: 'video'
                };
            }
            const imageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
            if (imageMatch) {
                return {
                    success: true,
                    url: imageMatch[1].replace(/&amp;/g, '&'),
                    title: 'Instagram Image',
                    type: 'image'
                };
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        try {
            const saveigRes = await axios.post('https://saveig.app/api/ajaxSearch', new URLSearchParams({
                q: url,
                t: 'media',
                lang: 'en'
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (saveigRes.data && saveigRes.data.data) {
                const htmlContent = saveigRes.data.data;
                const videoUrlMatch = htmlContent.match(/href="([^"]+)"[^>]*download/i) || htmlContent.match(/href="([^"]+)"[^>]*target="_blank"/i);
                if (videoUrlMatch) {
                    return {
                        success: true,
                        url: videoUrlMatch[1].replace(/&amp;/g, '&'),
                        title: 'Instagram Media',
                        type: videoUrlMatch[1].includes('.mp4') ? 'video' : 'image'
                    };
                }
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        try {
            const cobaltUrl = await downloadCobalt(url);
            if (cobaltUrl) {
                return {
                    success: true,
                    url: cobaltUrl,
                    title: 'Instagram Media',
                    type: 'video'
                };
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        throw new Error('Instagram download failed');
    } catch (err) {
        throw new Error(err.message);
    }
}

async function scrapeFacebook(url) {
    try {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });
            const html = response.data;
            const hdMatch = html.match(/"browser_native_hd_url"\s*:\s*"([^"]+)"/) || html.match(/hd_src\s*:\s*"([^"]+)"/);
            const sdMatch = html.match(/"browser_native_sd_url"\s*:\s*"([^"]+)"/) || html.match(/sd_src\s*:\s*"([^"]+)"/);
            const videoUrl = hdMatch ? hdMatch[1] : (sdMatch ? sdMatch[1] : null);
            if (videoUrl) {
                const cleanUrl = videoUrl.replace(/\\u002F/g, '/').replace(/\\u0026/g, '&');
                return {
                    success: true,
                    url: cleanUrl,
                    title: 'Facebook Video',
                    type: 'video'
                };
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        try {
            const cobaltUrl = await downloadCobalt(url);
            if (cobaltUrl) {
                return {
                    success: true,
                    url: cobaltUrl,
                    title: 'Facebook Video',
                    type: 'video'
                };
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        throw new Error('Facebook video not found');
    } catch (err) {
        throw new Error(err.message);
    }
}

async function scrapeTwitter(url) {
    try {
        try {
            const idMatch = url.match(/status\/(\d+)/);
            if (idMatch) {
                const tweetId = idMatch[1];
                const res = await axios.get(`https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                if (res.data && res.data.video) {
                    const variants = res.data.video.variants || [];
                    const mp4s = variants.filter(v => v.content_type === 'video/mp4');
                    if (mp4s.length > 0) {
                        mp4s.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                        return {
                            success: true,
                            url: mp4s[0].url,
                            title: res.data.text || 'Twitter Video',
                            type: 'video'
                        };
                    }
                }
                if (res.data && res.data.photos && res.data.photos.length > 0) {
                    return {
                        success: true,
                        url: res.data.photos[0].url,
                        title: res.data.text || 'Twitter Image',
                        type: 'image'
                    };
                }
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        try {
            const cobaltUrl = await downloadCobalt(url);
            if (cobaltUrl) {
                return {
                    success: true,
                    url: cobaltUrl,
                    title: 'Twitter Video',
                    type: 'video'
                };
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        throw new Error('Twitter media not found');
    } catch (err) {
        throw new Error(err.message);
    }
}

async function scrapeReddit(url) {
    try {
        try {
            const cleanUrl = url.split('?')[0].replace(/\/$/, '') + '.json';
            const res = await axios.get(cleanUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            const post = res.data[0].data.children[0].data;
            if (post.is_video && post.media && post.media.reddit_video) {
                return {
                    success: true,
                    url: post.media.reddit_video.fallback_url.split('?')[0],
                    title: post.title || 'Reddit Video',
                    type: 'video'
                };
            }
            if (post.url && (post.url.endsWith('.jpg') || post.url.endsWith('.png') || post.url.endsWith('.gif'))) {
                return {
                    success: true,
                    url: post.url,
                    title: post.title || 'Reddit Image',
                    type: 'image'
                };
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        try {
            const rapidRes = await axios.get(`https://rapidsave.com/api/post?url=${encodeURIComponent(url)}`);
            if (rapidRes.data && rapidRes.data.video) {
                return {
                    success: true,
                    url: rapidRes.data.video,
                    title: rapidRes.data.title || 'Reddit Video',
                    type: 'video'
                };
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        try {
            const cobaltUrl = await downloadCobalt(url);
            if (cobaltUrl) {
                return {
                    success: true,
                    url: cobaltUrl,
                    title: 'Reddit Video',
                    type: 'video'
                };
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        throw new Error('Reddit media not found');
    } catch (err) {
        throw new Error(err.message);
    }
}

async function scrapeKwai(url) {
    try {
        try {
            let finalUrl = url;
            const resRedirect = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
                },
                maxRedirects: 5
            });
            finalUrl = resRedirect.request.res.responseUrl || url;

            const resPage = await axios.get(finalUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            const html = resPage.data;
            const playUrlMatch = html.match(/"playUrl"\s*:\s*"([^"]+)"/) || html.match(/"srcUrl"\s*:\s*"([^"]+)"/) || html.match(/src="(https?:\/\/[^"]+\.mp4[^"]*)"/);
            if (playUrlMatch) {
                const cleanUrl = playUrlMatch[1].replace(/\\u002F/g, '/').replace(/\\u0026/g, '&');
                return {
                    success: true,
                    url: cleanUrl,
                    title: 'Kwai Video',
                    type: 'video'
                };
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        try {
            const cobaltUrl = await downloadCobalt(url);
            if (cobaltUrl) {
                return {
                    success: true,
                    url: cobaltUrl,
                    title: 'Kwai Video',
                    type: 'video'
                };
            }
        } catch (innerErr) {
            console.error(innerErr.message);
        }

        throw new Error('Kwai video not found');
    } catch (err) {
        throw new Error(err.message);
    }
}

module.exports = {
    scrapeTikTok,
    scrapeInstagram,
    scrapeFacebook,
    scrapeTwitter,
    scrapeReddit,
    scrapeKwai
};
