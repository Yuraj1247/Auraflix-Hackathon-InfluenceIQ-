import { useState, useRef } from 'react';
import { Radar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';
import { jsPDF } from 'jspdf';
import Card from './Card';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale);

const YOUTUBE_API_KEY = '';
const NEWS_API_KEY = '';
const GOOGLE_SEARCH_KEY = YOUTUBE_API_KEY;
const SEARCH_ENGINE_ID = '';
const RAPIDAPI_KEY = '';

function Analysis() {
  const [youtubeLink, setYoutubeLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [analysisData, setAnalysisData] = useState({
    persona: { content: 'Waiting for analysis...', avatar: '' },
    credibility: { content: 'Waiting for analysis...', chartData: null },
    timeline: { content: 'Waiting for analysis...', visual: [] },
    engagementPulse: { content: 'Waiting for analysis...', heatmap: [] },
    engagementTrend: { content: 'Waiting for analysis...', chartData: null },
    scorecard: { content: 'Waiting for analysis...' }
  });

  const personaRef = useRef(null);
  const credibilityRef = useRef(null);
  const timelineRef = useRef(null);
  const engagementPulseRef = useRef(null);
  const engagementTrendRef = useRef(null);
  const scorecardRef = useRef(null);

  const analyzeProfile = async () => {
    if (!youtubeLink && !instagramLink) return alert('Please enter at least one link (YouTube or Instagram)');
    setAnalysisData(prev => ({
      ...prev,
      persona: { ...prev.persona, content: 'Analyzing...' },
      credibility: { ...prev.credibility, content: 'Analyzing...' },
      timeline: { ...prev.timeline, content: 'Analyzing...' },
      engagementPulse: { ...prev.engagementPulse, content: 'Analyzing...' },
      engagementTrend: { ...prev.engagementTrend, content: 'Analyzing...' },
      scorecard: { ...prev.scorecard, content: 'Analyzing...' }
    }));

    const links = { youtube: youtubeLink, instagram: instagramLink };

    try {
      const ytPersona = youtubeLink ? await getYouTubePersona(links) : null;
      const igPersona = instagramLink ? await getInstagramPersona(links) : null;
      const persona = combinePersonas(ytPersona, igPersona);
      const ytCredibility = youtubeLink ? await getYouTubeCredibility(links) : null;
      const igCredibility = instagramLink ? await getInstagramCredibility(links) : null;
      const credibility = combineCredibility(ytCredibility, igCredibility);
      const ytTimeline = youtubeLink ? await getYouTubeTimeline(links) : null;
      const igTimeline = instagramLink ? await getInstagramTimeline(links) : null;
      const timeline = combineTimeline(ytTimeline, igTimeline);
      const ytEngagement = youtubeLink ? await getYouTubeEngagement(links) : null;
      const igEngagement = instagramLink ? await getInstagramEngagement(links) : null;
      const engagement = combineEngagement(ytEngagement, igEngagement);
      const scorecard = calculateScorecard(persona, credibility, timeline, engagement, links);

      setAnalysisData({
        persona: { content: formatPersona(persona), avatar: persona.avatar },
        credibility: {
          content: formatCredibility(credibility),
          chartData: {
            labels: ['News', 'Web', 'Consistency', 'Quality', 'Peer', 'Links', 'Originality', 'Verified'],
            datasets: [{
              label: 'Credibility Matrix',
              data: [credibility.newsAuthority, credibility.webPresence, credibility.consistency, credibility.contentQuality, credibility.peerReview, credibility.authorityLinks, credibility.originality, credibility.verified],
              backgroundColor: 'rgba(0, 212, 255, 0.2)',
              borderColor: '#00d4ff',
              borderWidth: 2
            }]
          }
        },
        timeline: { content: formatTimeline(timeline), visual: timeline.peakMoments.slice(0, 5) },
        engagementPulse: { content: formatEngagementPulse(engagement), heatmap: engagement.heatmapData.slice(0, 5) },
        engagementTrend: {
          content: formatEngagementTrend(engagement),
          chartData: {
            labels: ['Post 10', 'Post 9', 'Post 8', 'Post 7', 'Post 6', 'Post 5', 'Post 4', 'Post 3', 'Post 2', 'Post 1'],
            datasets: [{ label: 'Engagement Rate (%)', data: engagement.trendData.reverse(), borderColor: '#00d4ff', fill: false }]
          }
        },
        scorecard: { content: formatScorecard(scorecard) }
      });
    } catch (error) {
      console.error('Analysis Error:', error);
      setAnalysisData(prev => ({
        ...prev,
        persona: { ...prev.persona, content: `Error: ${error.message}` },
        credibility: { ...prev.credibility, content: `Error: ${error.message}` },
        timeline: { ...prev.timeline, content: `Error: ${error.message}` },
        engagementPulse: { ...prev.engagementPulse, content: `Error: ${error.message}` },
        engagementTrend: { ...prev.engagementTrend, content: `Error: ${error.message}` },
        scorecard: { ...prev.scorecard, content: `Error: ${error.message}` }
      }));
    }
  };

  const exportReport = () => {
    const doc = new jsPDF();
    doc.text('InfluenceIQ Report', 10, 10);
    doc.text(personaRef.current.innerText, 10, 20);
    doc.text(credibilityRef.current.innerText, 10, 50);
    doc.text(timelineRef.current.innerText, 10, 80);
    doc.text(engagementPulseRef.current.innerText, 10, 110);
    doc.text(engagementTrendRef.current.innerText, 10, 140);
    doc.text(scorecardRef.current.innerText, 10, 170);
    doc.save('InfluenceIQ_Report.pdf');
  };

 
  
  async function getYouTubePersona(links) {
    let persona = { name: 'Unknown', avatar: '', followers: 0, accountAge: 0, totalViews: 0, personaType: 'Unknown', source: 'YouTube Data API', channelId: '', bio: '' };
    const channelId = extractChannelId(links.youtube);
    const searchUrl = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelId)}&key=${YOUTUBE_API_KEY}`;

    try {
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) throw new Error(`YouTube Search API failed: ${searchResponse.statusText}`);
      const searchData = await searchResponse.json();
      if (searchData.items && searchData.items.length > 0) {
        const actualChannelId = searchData.items[0].id.channelId;
        const channelUrl = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${actualChannelId}&key=${YOUTUBE_API_KEY}`;
        const channelResponse = await fetch(channelUrl);
        if (!channelResponse.ok) throw new Error(`YouTube Channel API failed: ${channelResponse.statusText}`);
        const channelData = await channelResponse.json();
        if (channelData.items && channelData.items.length > 0) {
          const item = channelData.items[0];
          persona = {
            name: item.snippet.title,
            avatar: item.snippet.thumbnails.default.url,
            followers: parseInt(item.statistics.subscriberCount) || 0,
            accountAge: new Date().getFullYear() - new Date(item.snippet.publishedAt).getFullYear(),
            totalViews: parseInt(item.statistics.viewCount) || 0,
            personaType: inferPersonaType(item.snippet.description),
            channelId: actualChannelId,
            source: 'YouTube Data API',
            bio: item.snippet.description || 'No bio available'
          };
        }
      }
    } catch (error) {
      console.error('YouTube Persona Error:', error);
      persona.source = `YouTube Data API (Failed: ${error.message})`;
    }
    return persona;
  }

  async function getInstagramPersona(links) {
    const userId = '25025320'; 
    const url = `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/reels?user_id=${userId}&include_feed_video=true`;
    const options = {
      method: 'GET',
      headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com' }
    };
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`Instagram API failed: ${response.statusText}`);
      const data = await response.json();
      return {
        name: data.user?.full_name || extractInstagramUsername(links.instagram),
        avatar: data.user?.profile_pic_url || '',
        followers: data.user?.follower_count || 0,
        accountAge: data.user?.account_age || Math.floor((Date.now() - new Date(data.user?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 365)),
        totalViews: data.total_views || 0,
        personaType: inferPersonaType(data.user?.biography || ''),
        source: 'Instagram Scrapper API',
        bio: data.user?.biography || 'No bio available'
      };
    } catch (error) {
      console.error('Instagram Persona Error:', error);
      return { name: extractInstagramUsername(links.instagram), avatar: '', followers: 0, accountAge: 0, totalViews: 0, personaType: 'Unknown', source: `Instagram Scrapper API (Failed: ${error.message})`, bio: `Error: ${error.message}` };
    }
  }

  function combinePersonas(yt, ig) {
    if (!yt && !ig) return { name: 'N/A', avatar: '', followers: 0, accountAge: 0, totalViews: 0, personaType: 'N/A', source: 'N/A', channelId: '', bio: 'N/A' };
    if (!yt) return ig;
    if (!ig) return yt;
    return {
      name: `${yt.name}${ig ? ` (${ig.name})` : ''}`,
      avatar: yt.avatar || ig.avatar,
      followers: yt.followers + (ig ? ig.followers : 0),
      accountAge: Math.max(yt.accountAge, ig ? ig.accountAge : 0),
      totalViews: yt.totalViews + (ig ? ig.totalViews : 0),
      personaType: yt.personaType,
      source: `${yt.source}${ig ? `, ${ig.source}` : ''}`,
      channelId: yt.channelId || '',
      bio: `${yt.bio}${ig ? `\nInstagram Bio: ${ig.bio}` : ''}`
    };
  }

  async function getYouTubeCredibility(links) {
    const name = extractChannelId(links.youtube);
    let credibility = { newsAuthority: '0.00', webPresence: '0.00', consistency: '0.00', contentQuality: '0.00', crossVerified: false, peerReview: '0.00', spamFlag: false, authorityLinks: '0.00', originality: '0.00', verified: '0.00', audienceOverlap: '0.00', sources: [] };

    try {
      const newsResponse = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(name)}&apiKey=${NEWS_API_KEY}`);
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        credibility.newsAuthority = Math.min(newsData.totalResults || 0, 100).toFixed(2);
        credibility.crossVerified = newsData.articles.some(a => a.title.toLowerCase().includes(name.toLowerCase()));
        credibility.sources.push('NewsAPI');
      }

      const searchResponse = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(name)}`);
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        credibility.webPresence = Math.min(searchData.searchInformation.totalResults / 1000 || 0, 100).toFixed(2);
        credibility.authorityLinks = Math.min(searchData.items.filter(i => i.link.includes('.edu') || i.link.includes('.org')).length * 10, 100).toFixed(2);
        credibility.peerReview = searchData.items.some(i => i.title.toLowerCase().includes('top influencer')) ? '50.00' : '0.00';
        credibility.sources.push('Google Custom Search');
      }

      const persona = await getYouTubePersona(links);
      const videoUrl = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${persona.channelId}&maxResults=10&order=date&key=${YOUTUBE_API_KEY}`;
      const videoResponse = await fetch(videoUrl);
      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        const videoIds = videoData.items.map(item => item.id.videoId).join(',');
        const statsUrl = `https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
        const statsResponse = await fetch(statsUrl);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          credibility.consistency = Math.min(calculateConsistency(videoData.items.map(item => item.snippet.publishedAt)), 100).toFixed(2);
          credibility.contentQuality = Math.min(calculateContentQuality(statsData.items), 100).toFixed(2);
          credibility.spamFlag = persona.totalViews / persona.followers < 0.01;
          credibility.originality = Math.min(calculateOriginality(videoData.items), 100).toFixed(2);
          credibility.audienceOverlap = videoData.items.some(v => v.snippet.description.includes('collab')) ? '20.00' : '0.00';
        }
      }

      const channelUrl = `https://youtube.googleapis.com/youtube/v3/channels?part=status&id=${persona.channelId}&key=${YOUTUBE_API_KEY}`;
      const channelResponse = await fetch(channelUrl);
      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        credibility.verified = channelData.items[0].status.isVerified ? '50.00' : '0.00';
      }
    } catch (error) {
      console.error('YouTube Credibility Error:', error);
      credibility.sources.push(`Error: ${error.message}`);
    }
    return credibility;
  }

  async function getInstagramCredibility(links) {
    const userId = '25025320';
    const url = `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/reels?user_id=${userId}&include_feed_video=true`;
    const options = {
      method: 'GET',
      headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com' }
    };
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`Instagram API failed: ${response.statusText}`);
      const data = await response.json();
      let credibility = { newsAuthority: '0.00', webPresence: '0.00', consistency: '0.00', contentQuality: '0.00', crossVerified: false, peerReview: '0.00', spamFlag: false, authorityLinks: '0.00', originality: '0.00', verified: '0.00', audienceOverlap: '0.00', sources: ['Instagram Scrapper API'] };
      credibility.verified = data.user?.is_verified ? '50.00' : '0.00';
      return credibility;
    } catch (error) {
      console.error('Instagram Credibility Error:', error);
      return { newsAuthority: '0.00', webPresence: '0.00', consistency: '0.00', contentQuality: '0.00', crossVerified: false, peerReview: '0.00', spamFlag: false, authorityLinks: '0.00', originality: '0.00', verified: '0.00', audienceOverlap: '0.00', sources: [`Instagram Scrapper API (Failed: ${error.message})`] };
    }
  }

  function combineCredibility(yt, ig) {
    if (!yt && !ig) return { newsAuthority: '0.00', webPresence: '0.00', consistency: '0.00', contentQuality: '0.00', crossVerified: false, peerReview: '0.00', spamFlag: false, authorityLinks: '0.00', originality: '0.00', verified: '0.00', audienceOverlap: '0.00', sources: [] };
    if (!yt) return ig;
    if (!ig) return yt;
    return {
      newsAuthority: ((parseFloat(yt.newsAuthority) + parseFloat(ig.newsAuthority)) / 2).toFixed(2),
      webPresence: ((parseFloat(yt.webPresence) + parseFloat(ig.webPresence)) / 2).toFixed(2),
      consistency: ((parseFloat(yt.consistency) + parseFloat(ig.consistency)) / 2).toFixed(2),
      contentQuality: ((parseFloat(yt.contentQuality) + parseFloat(ig.contentQuality)) / 2).toFixed(2),
      crossVerified: yt.crossVerified || ig.crossVerified,
      peerReview: ((parseFloat(yt.peerReview) + parseFloat(ig.peerReview)) / 2).toFixed(2),
      spamFlag: yt.spamFlag || ig.spamFlag,
      authorityLinks: ((parseFloat(yt.authorityLinks) + parseFloat(ig.authorityLinks)) / 2).toFixed(2),
      originality: ((parseFloat(yt.originality) + parseFloat(ig.originality)) / 2).toFixed(2),
      verified: ((parseFloat(yt.verified) + parseFloat(ig.verified)) / 2).toFixed(2),
      audienceOverlap: ((parseFloat(yt.audienceOverlap) + parseFloat(ig.audienceOverlap)) / 2).toFixed(2),
      sources: [...new Set([...yt.sources, ...ig.sources])]
    };
  }

  async function getYouTubeTimeline(links) {
    let timeline = { longevityScore: '0.00', trendMomentum: '0.00', decayRate: '0.00', buzzScore: '0.00', milestones: [], consistencyOverTime: '0.00', legacyImpact: '0.00', volatility: '0.00', seasonalFilter: '0.00', evolution: '0.00', retentionLongevity: '0.00', peakMoments: [], source: 'YouTube Data API' };
    const persona = await getYouTubePersona(links);
    timeline.longevityScore = Math.min(persona.accountAge * 10, 100).toFixed(2);

    try {
      const videoUrl = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${persona.channelId}&maxResults=20&order=date&key=${YOUTUBE_API_KEY}`;
      const videoResponse = await fetch(videoUrl);
      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        const videoIds = videoData.items.map(item => item.id.videoId).join(',');
        const statsUrl = `https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
        const statsResponse = await fetch(statsUrl);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const recentViews = statsData.items.slice(0, 5).reduce((sum, item) => sum + parseInt(item.statistics.viewCount || 0), 0);
          const olderViews = statsData.items.slice(5).reduce((sum, item) => sum + parseInt(item.statistics.viewCount || 0), 0);
          timeline.trendMomentum = Math.min(recentViews / persona.totalViews * 100 || 0, 100).toFixed(2);
          timeline.decayRate = Math.min(olderViews ? (olderViews - recentViews) / olderViews * 100 : 0, 100).toFixed(2);
          timeline.legacyImpact = Math.min(olderViews / persona.totalViews * 100 || 0, 100).toFixed(2);
          timeline.consistencyOverTime = Math.min(calculateConsistency(videoData.items.map(item => item.snippet.publishedAt)), 100).toFixed(2);
          timeline.volatility = Math.min(statsData.items.map(i => parseInt(i.statistics.viewCount || 0)).reduce((a, b) => Math.max(a, b)) / Math.min(...statsData.items.map(i => parseInt(i.statistics.viewCount || 1))) * 10, 100).toFixed(2);
          timeline.peakMoments = statsData.items.map(item => ({ date: new Date().toLocaleDateString(), views: parseInt(item.statistics.viewCount || 0) }));
          timeline.milestones = persona.followers > 100000 ? ['Reached 100k Subs'] : [];
          timeline.seasonalFilter = Math.min(calculateSeasonalFilter(videoData.items), 100).toFixed(2);
          timeline.evolution = Math.min(calculateEvolution(videoData.items), 100).toFixed(2);
          timeline.retentionLongevity = Math.min(estimateRetentionLongevity(videoData.items), 100).toFixed(2);
        }
      }

      const buzzResponse = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(extractChannelId(links.youtube))}&from=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}&apiKey=${NEWS_API_KEY}`);
      if (buzzResponse.ok) {
        const buzzData = await buzzResponse.json();
        timeline.buzzScore = Math.min(buzzData.totalResults || 0, 100).toFixed(2);
      }
    } catch (error) {
      console.error('YouTube Timeline Error:', error);
      timeline.source = `YouTube Data API (Failed: ${error.message})`;
    }
    return timeline;
  }

  async function getInstagramTimeline(links) {
    const userId = '25025320';
    const url = `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/reels?user_id=${userId}&include_feed_video=true`;
    const options = {
      method: 'GET',
      headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com' }
    };
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`Instagram API failed: ${response.statusText}`);
      const data = await response.json();
      return {
        longevityScore: data.user?.account_age ? Math.min(data.user.account_age * 10, 100).toFixed(2) : '0.00',
        trendMomentum: '0.00',
        decayRate: '0.00',
        buzzScore: '0.00',
        milestones: data.user?.follower_count > 100000 ? ['Reached 100k Followers'] : [],
        consistencyOverTime: '0.00',
        legacyImpact: '0.00',
        volatility: '0.00',
        seasonalFilter: '0.00',
        evolution: '0.00',
        retentionLongevity: '0.00',
        peakMoments: [],
        source: 'Instagram Scrapper API'
      };
    } catch (error) {
      console.error('Instagram Timeline Error:', error);
      return { longevityScore: '0.00', trendMomentum: '0.00', decayRate: '0.00', buzzScore: '0.00', milestones: [], consistencyOverTime: '0.00', legacyImpact: '0.00', volatility: '0.00', seasonalFilter: '0.00', evolution: '0.00', retentionLongevity: '0.00', peakMoments: [], source: `Instagram Scrapper API (Failed: ${error.message})` };
    }
  }

  function combineTimeline(yt, ig) {
    if (!yt && !ig) return { longevityScore: '0.00', trendMomentum: '0.00', decayRate: '0.00', buzzScore: '0.00', milestones: [], consistencyOverTime: '0.00', legacyImpact: '0.00', volatility: '0.00', seasonalFilter: '0.00', evolution: '0.00', retentionLongevity: '0.00', peakMoments: [], source: 'N/A' };
    if (!yt) return ig;
    if (!ig) return yt;
    return {
      longevityScore: ((parseFloat(yt.longevityScore) + parseFloat(ig.longevityScore)) / 2).toFixed(2),
      trendMomentum: ((parseFloat(yt.trendMomentum) + parseFloat(ig.trendMomentum)) / 2).toFixed(2),
      decayRate: ((parseFloat(yt.decayRate) + parseFloat(ig.decayRate)) / 2).toFixed(2),
      buzzScore: ((parseFloat(yt.buzzScore) + parseFloat(ig.buzzScore)) / 2).toFixed(2),
      milestones: [...new Set([...yt.milestones, ...ig.milestones])],
      consistencyOverTime: ((parseFloat(yt.consistencyOverTime) + parseFloat(ig.consistencyOverTime)) / 2).toFixed(2),
      legacyImpact: ((parseFloat(yt.legacyImpact) + parseFloat(ig.legacyImpact)) / 2).toFixed(2),
      volatility: ((parseFloat(yt.volatility) + parseFloat(ig.volatility)) / 2).toFixed(2),
      seasonalFilter: ((parseFloat(yt.seasonalFilter) + parseFloat(ig.seasonalFilter)) / 2).toFixed(2),
      evolution: ((parseFloat(yt.evolution) + parseFloat(ig.evolution)) / 2).toFixed(2),
      retentionLongevity: ((parseFloat(yt.retentionLongevity) + parseFloat(ig.retentionLongevity)) / 2).toFixed(2),
      peakMoments: yt.peakMoments.length ? yt.peakMoments.slice(0, 5) : ig.peakMoments.slice(0, 5),
      source: `${yt.source}${ig ? `, ${ig.source}` : ''}`
    };
  }

  async function getYouTubeEngagement(links) {
    let engagement = { rate: '0.00', sentiment: '0.00', reachAmplifier: '0.00', retentionIndex: '0.00', commentQuality: '0.00', growthRate: '0.00', viralSpikes: '0.00', socialEcho: '0.00', depthRatio: '0.00', authenticity: '0.00', engagementDecay: '0.00', trendRelevance: '0.00', trendData: [], heatmapData: [], source: 'YouTube Data API' };
    const persona = await getYouTubePersona(links);

    try {
      const videoUrl = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${persona.channelId}&maxResults=10&order=date&key=${YOUTUBE_API_KEY}`;
      const videoResponse = await fetch(videoUrl);
      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        const videoIds = videoData.items.map(item => item.id.videoId).join(',');
        const statsUrl = `https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
        const statsResponse = await fetch(statsUrl);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const totalViews = statsData.items.reduce((sum, item) => sum + parseInt(item.statistics.viewCount || 0), 0);
          const totalLikes = statsData.items.reduce((sum, item) => sum + parseInt(item.statistics.likeCount || 0), 0);
          const totalComments = statsData.items.reduce((sum, item) => sum + parseInt(item.statistics.commentCount || 0), 0);
          engagement.rate = Math.min(totalViews ? (totalLikes + totalComments) / totalViews * 100 : 0, 100).toFixed(2);
          engagement.retentionIndex = Math.min(totalViews / persona.followers * 100 || 0, 100).toFixed(2);
          engagement.commentQuality = Math.min(totalComments ? totalComments / statsData.items.length * 5 : 0, 100).toFixed(2);
          engagement.growthRate = Math.min(persona.followers / persona.accountAge / 1000 || 0, 100).toFixed(2);
          engagement.viralSpikes = statsData.items.some(i => parseInt(i.statistics.viewCount || 0) > totalViews / statsData.items.length * 5) ? '50.00' : '0.00';
          engagement.trendData = statsData.items.map(item => Math.min(((parseInt(item.statistics.likeCount || 0) + parseInt(item.statistics.commentCount || 0)) / parseInt(item.statistics.viewCount || 1) * 100), 100).toFixed(2));
          engagement.heatmapData = statsData.items.map(item => parseInt(item.statistics.viewCount || 0));
          engagement.sentiment = '50.00';
          engagement.depthRatio = Math.min(calculateDepthRatio(statsData.items), 100).toFixed(2);
          engagement.authenticity = Math.min(detectAuthenticity(statsData.items), 100).toFixed(2);
          engagement.engagementDecay = Math.min(calculateEngagementDecay(statsData.items), 100).toFixed(2);
          engagement.trendRelevance = Math.min(calculateTrendRelevance(videoData.items), 100).toFixed(2);
        }
      }
      const newsMentions = parseFloat((await getYouTubeCredibility(links)).newsAuthority);
      engagement.reachAmplifier = Math.min(newsMentions > 0 ? engagement.rate * (1 + newsMentions / 100) : engagement.rate, 100).toFixed(2);
      engagement.socialEcho = Math.min(newsMentions * 2, 100).toFixed(2);
    } catch (error) {
      console.error('YouTube Engagement Error:', error);
      engagement.source = `YouTube Data API (Failed: ${error.message})`;
    }
    return engagement;
  }

  async function getInstagramEngagement(links) {
    const userId = '25025320';
    const url = `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/reels?user_id=${userId}&include_feed_video=true`;
    const options = {
      method: 'GET',
      headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': 'instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com' }
    };
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`Instagram API failed: ${response.statusText}`);
      const data = await response.json();
      return {
        rate: '0.00',
        sentiment: '50.00',
        reachAmplifier: '0.00',
        retentionIndex: '0.00',
        commentQuality: '0.00',
        growthRate: Math.min(data.user?.follower_count / (data.user?.account_age || 1) / 1000 || 0, 100).toFixed(2),
        viralSpikes: '0.00',
        socialEcho: '0.00',
        depthRatio: '0.00',
        authenticity: data.user?.is_verified ? '100.00' : '50.00',
        engagementDecay: '0.00',
        trendRelevance: '0.00',
        trendData: [],
        heatmapData: [],
        source: 'Instagram Scrapper API'
      };
    } catch (error) {
      console.error('Instagram Engagement Error:', error);
      return { rate: '0.00', sentiment: '0.00', reachAmplifier: '0.00', retentionIndex: '0.00', commentQuality: '0.00', growthRate: '0.00', viralSpikes: '0.00', socialEcho: '0.00', depthRatio: '0.00', authenticity: '0.00', engagementDecay: '0.00', trendRelevance: '0.00', trendData: [], heatmapData: [], source: `Instagram Scrapper API (Failed: ${error.message})` };
    }
  }

  function combineEngagement(yt, ig) {
    if (!yt && !ig) return { rate: '0.00', sentiment: '0.00', reachAmplifier: '0.00', retentionIndex: '0.00', commentQuality: '0.00', growthRate: '0.00', viralSpikes: '0.00', socialEcho: '0.00', depthRatio: '0.00', authenticity: '0.00', engagementDecay: '0.00', trendRelevance: '0.00', trendData: [], heatmapData: [], source: 'N/A' };
    if (!yt) return ig;
    if (!ig) return yt;
    return {
      rate: ((parseFloat(yt.rate) + parseFloat(ig.rate)) / 2).toFixed(2),
      sentiment: ((parseFloat(yt.sentiment) + parseFloat(ig.sentiment)) / 2).toFixed(2),
      reachAmplifier: ((parseFloat(yt.reachAmplifier) + parseFloat(ig.reachAmplifier)) / 2).toFixed(2),
      retentionIndex: ((parseFloat(yt.retentionIndex) + parseFloat(ig.retentionIndex)) / 2).toFixed(2),
      commentQuality: ((parseFloat(yt.commentQuality) + parseFloat(ig.commentQuality)) / 2).toFixed(2),
      growthRate: ((parseFloat(yt.growthRate) + parseFloat(ig.growthRate)) / 2).toFixed(2),
      viralSpikes: ((parseFloat(yt.viralSpikes) + parseFloat(ig.viralSpikes)) / 2).toFixed(2),
      socialEcho: ((parseFloat(yt.socialEcho) + parseFloat(ig.socialEcho)) / 2).toFixed(2),
      depthRatio: ((parseFloat(yt.depthRatio) + parseFloat(ig.depthRatio)) / 2).toFixed(2),
      authenticity: ((parseFloat(yt.authenticity) + parseFloat(ig.authenticity)) / 2).toFixed(2),
      engagementDecay: ((parseFloat(yt.engagementDecay) + parseFloat(ig.engagementDecay)) / 2).toFixed(2),
      trendRelevance: ((parseFloat(yt.trendRelevance) + parseFloat(ig.trendRelevance)) / 2).toFixed(2),
      trendData: yt.trendData.length ? yt.trendData : ig.trendData,
      heatmapData: yt.heatmapData.length ? yt.heatmapData : ig.heatmapData,
      source: `${yt.source}${ig ? `, ${ig.source}` : ''}`
    };
  }

  function calculateScorecard(persona, credibility, timeline, engagement, links) {
    const credibilityScore = Math.min(
      (parseFloat(credibility.newsAuthority) / 100) * 15 + (parseFloat(credibility.webPresence) / 1000) * 10 + parseFloat(credibility.consistency) * 10 +
      parseFloat(credibility.contentQuality) * 15 + parseFloat(credibility.peerReview) * 15 - (credibility.spamFlag ? 20 : 0) +
      parseFloat(credibility.authorityLinks) * 10 + parseFloat(credibility.originality) * 10 + parseFloat(credibility.verified) * 10 -
      parseFloat(credibility.audienceOverlap) * 5, 100
    ).toFixed(2);
    const longevityScore = Math.min(
      parseFloat(timeline.longevityScore) * 0.4 + (100 - parseFloat(timeline.decayRate)) * 0.15 + parseFloat(timeline.legacyImpact) * 0.15 +
      parseFloat(timeline.consistencyOverTime) * 0.1 + parseFloat(timeline.seasonalFilter) * 0.1 + parseFloat(timeline.evolution) * 0.1 +
      parseFloat(timeline.retentionLongevity) * 0.1, 100
    ).toFixed(2);
    const engagementScore = Math.min(
      parseFloat(engagement.rate) * 8 + parseFloat(engagement.reachAmplifier) * 0.2 + parseFloat(engagement.retentionIndex) * 0.15 +
      parseFloat(engagement.commentQuality) * 0.15 + parseFloat(engagement.growthRate) + parseFloat(engagement.socialEcho) * 0.15 -
      parseFloat(engagement.viralSpikes) * 0.1 + parseFloat(engagement.depthRatio) * 0.1 + parseFloat(engagement.authenticity) * 0.1 +
      parseFloat(engagement.engagementDecay) * 0.1 + parseFloat(engagement.trendRelevance) * 0.1, 100
    ).toFixed(2);
    const total = (parseFloat(credibilityScore) * 0.4 + parseFloat(longevityScore) * 0.3 + parseFloat(engagementScore) * 0.3).toFixed(2);
    const ytWeight = links.youtube ? (links.instagram ? 50 : 100) : 0;
    const igWeight = links.instagram ? (links.youtube ? 50 : 100) : 0;
    return { credibility: credibilityScore, longevity: longevityScore, engagement: engagementScore, total, dataSources: { youtube: ytWeight, instagram: igWeight, news: 20, google: 20 } };
  }

  function formatPersona(data) {
    return `<p><strong>Name:</strong> ${data.name}</p><p><strong>Type:</strong> ${data.personaType}</p><p><strong>Followers:</strong> ${data.followers.toLocaleString()}</p><p><strong>Total Views:</strong> ${data.totalViews.toLocaleString()}</p><p><strong>Age:</strong> ${data.accountAge} years</p><p><strong>Bio:</strong> ${data.bio}</p><p class="stats"><em>Source: ${data.source}</em></p>`;
  }

  function formatCredibility(data) {
    return `<p><strong>News Authority:</strong> ${data.newsAuthority}/100</p><p><strong>Web Presence:</strong> ${data.webPresence}/100</p><p><strong>Consistency:</strong> ${data.consistency}/100</p><p><strong>Content Quality:</strong> ${data.contentQuality}/100</p><p><strong>Cross-Verified:</strong> ${data.crossVerified ? 'Yes' : 'No'}</p><p><strong>Peer Review:</strong> ${data.peerReview}/100</p><p><strong>Spam Flag:</strong> ${data.spamFlag ? 'Yes' : 'No'}</p><p><strong>Authority Links:</strong> ${data.authorityLinks}/100</p><p><strong>Originality:</strong> ${data.originality}/100</p><p><strong>Verified:</strong> ${data.verified}/100</p><p><strong>Audience Overlap:</strong> ${data.audienceOverlap}/100</p><p class="stats"><em>Sources: ${data.sources.join(', ')}</em></p>`;
  }

  function formatTimeline(data) {
    return `<p><strong>Longevity Score:</strong> ${data.longevityScore}/100</p><p><strong>Trend Momentum:</strong> ${data.trendMomentum}/100</p><p><strong>Decay Rate:</strong> ${data.decayRate}/100</p><p><strong>Buzz (7 days):</strong> ${data.buzzScore}/100</p><p><strong>Milestones:</strong> ${data.milestones.join(', ') || 'None'}</p><p><strong>Consistency:</strong> ${data.consistencyOverTime}/100</p><p><strong>Legacy Impact:</strong> ${data.legacyImpact}/100</p><p><strong>Volatility:</strong> ${data.volatility}/100</p><p><strong>Seasonal Filter:</strong> ${data.seasonalFilter}/100</p><p><strong>Evolution:</strong> ${data.evolution}/100</p><p><strong>Retention Longevity:</strong> ${data.retentionLongevity}/100</p><p class="stats"><em>Source: ${data.source}</em></p>`;
  }

  function formatEngagementPulse(data) {
    return `<p><strong>Engagement Rate:</strong> ${data.rate}/100</p><p><strong>Sentiment:</strong> ${data.sentiment}/100</p><p><strong>Reach Amplifier:</strong> ${data.reachAmplifier}/100</p><p><strong>Retention Index:</strong> ${data.retentionIndex}/100</p><p><strong>Comment Quality:</strong> ${data.commentQuality}/100</p><p><strong>Social Echo:</strong> ${data.socialEcho}/100</p><p class="stats"><em>Source: ${data.source}</em></p>`;
  }

  function formatEngagementTrend(data) {
    return `<p><strong>Growth Rate:</strong> ${data.growthRate}/100</p><p><strong>Viral Spikes:</strong> ${data.viralSpikes}/100</p><p><strong>Depth Ratio:</strong> ${data.depthRatio}/100</p><p><strong>Authenticity:</strong> ${data.authenticity}/100</p><p><strong>Engagement Decay:</strong> ${data.engagementDecay}/100</p><p><strong>Trend Relevance:</strong> ${data.trendRelevance}/100</p>`;
  }

  function formatScorecard(data) {
    return `<p><strong>Credibility (⭐):</strong> ${data.credibility}/100</p><p><strong>Longevity (⏳):</strong> ${data.longevity}/100</p><p><strong>Engagement (📈):</strong> ${data.engagement}/100</p><p><strong>InfluenceIQ Score:</strong> ${data.total}/100</p><p><strong>Data Sources:</strong> YouTube (${data.dataSources.youtube}%), Instagram (${data.dataSources.instagram}%), NewsAPI (${data.dataSources.news}%), Google (${data.dataSources.google}%)</p><p class="stats"><em>Compared to Top Influencers: ${data.total > 80 ? 'Elite' : 'Rising'}</em></p>`;
  }

  function inferPersonaType(description) {
    if (description.toLowerCase().includes('motivation')) return 'Thought Leader';
    if (description.toLowerCase().includes('entertainment')) return 'Entertainer';
    return 'Creator';
  }

  function calculateConsistency(dates) {
    const timestamps = dates.map(date => new Date(date).getTime());
    const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    return Math.min(100 - variance / 100000000, 100);
  }

  function calculateContentQuality(videos) {
    const avgLikesPerView = videos.reduce((sum, v) => sum + (parseInt(v.statistics.likeCount || 0) / parseInt(v.statistics.viewCount || 1)), 0) / videos.length * 100;
    return Math.min(avgLikesPerView * 20, 100);
  }

  function calculateOriginality(videos) {
    const titles = videos.map(v => v.snippet.title);
    const uniqueWords = new Set(titles.join(' ').split(' ')).size;
    return Math.min(uniqueWords / 50 * 100, 100);
  }

  function calculateSeasonalFilter(videos) {
    const months = videos.map(v => new Date(v.snippet.publishedAt).getMonth());
    const monthCounts = months.reduce((acc, m) => (acc[m] = (acc[m] || 0) + 1, acc), {});
    return Object.values(monthCounts).some(c => c > 5) ? 50 : 100;
  }

  function calculateEvolution(videos) {
    const early = videos.slice(0, 5).map(v => v.snippet.title).join(' ');
    const recent = videos.slice(-5).map(v => v.snippet.title).join(' ');
    const overlap = early.split(' ').filter(w => recent.includes(w)).length;
    return Math.min((1 - overlap / early.split(' ').length) * 100, 100);
  }

  function estimateRetentionLongevity(videos) {
    return Math.min(videos.length * 10, 100);
  }

  function calculateDepthRatio(videos) {
    const totalComments = videos.reduce((sum, v) => sum + parseInt(v.statistics.commentCount || 0), 0);
    const totalLikes = videos.reduce((sum, v) => sum + parseInt(v.statistics.likeCount || 0), 0);
    return totalLikes ? Math.min((totalComments / totalLikes) * 100, 100) : 0;
  }

  function detectAuthenticity(videos) {
    const viewToCommentRatio = videos.map(v => parseInt(v.statistics.viewCount || 0) / (parseInt(v.statistics.commentCount || 1))).reduce((a, b) => a + b, 0) / videos.length;
    return viewToCommentRatio > 1000 ? 50 : 100;
  }

  function calculateEngagementDecay(videos) {
    const earlyViews = videos.slice(-5).reduce((sum, v) => sum + parseInt(v.statistics.viewCount || 0), 0);
    const laterViews = videos.slice(0, 5).reduce((sum, v) => sum + parseInt(v.statistics.viewCount || 0), 0);
    return Math.min((earlyViews / (laterViews || 1)) * 100, 100);
  }

  function calculateTrendRelevance(videos) {
    const titles = videos.map(v => v.snippet.title.toLowerCase());
    const trends = ['ai', 'tech', '2025'];
    return titles.some(t => trends.some(tr => t.includes(tr))) ? 50 : 0;
  }

  function extractChannelId(link) {
    if (!link) return '';
    if (link.includes('youtube.com/@')) return link.split('@')[1].split('?')[0];
    if (link.includes('youtube.com/channel/')) return link.split('channel/')[1].split('?')[0];
    if (link.startsWith('@')) return link.substring(1);
    return link;
  }

  function extractInstagramUsername(link) {
    if (!link) return '';
    if (link.includes('instagram.com/')) return link.split('instagram.com/')[1].split('/')[0];
    if (link.startsWith('@')) return link.substring(1);
    return link;
  }

  return (
    <section className="section" id="analysis">
      <div>
        <h2 className="section-title">Influence Dashboard</h2>
        <div className="input-container">
          <input
            type="text"
            placeholder="YouTube (e.g., @ChangeYouthMindset or full link)"
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value.trim())}
          />
          <input
            type="text"
            placeholder="Instagram (e.g., @username or full link)"
            value={instagramLink}
            onChange={(e) => setInstagramLink(e.target.value.trim())}
          />
          <button className="cta-btn" onClick={analyzeProfile}>Analyze</button>
        </div>
        <div className="grid">
          <Card
            title="Influence Persona"
            ref={personaRef}
            content={<div dangerouslySetInnerHTML={{ __html: analysisData.persona.content }} />}
            extra={<img className="avatar" src={analysisData.persona.avatar} alt="Avatar" />}
          />
          <Card
            title="Credibility Matrix"
            ref={credibilityRef}
            content={<div dangerouslySetInnerHTML={{ __html: analysisData.credibility.content }} />}
            extra={analysisData.credibility.chartData && (
              <div className="chart-container">
                <Radar data={analysisData.credibility.chartData} options={{ responsive: true, scales: { r: { beginAtZero: true, max: 100 } } }} />
              </div>
            )}
          />
          <Card
            title="Impact Timeline"
            ref={timelineRef}
            content={<div dangerouslySetInnerHTML={{ __html: analysisData.timeline.content }} />}
            extra={
              <div className="timeline">
                {analysisData.timeline.visual.map((m, i) => (
                  <div key={i} className="timeline-item">{m.date}: {m.views.toLocaleString()} views</div>
                ))}
              </div>
            }
          />
          <Card
            title="Engagement Pulse"
            ref={engagementPulseRef}
            content={<div dangerouslySetInnerHTML={{ __html: analysisData.engagementPulse.content }} />}
            extra={
              <div className="heatmap">
                {analysisData.engagementPulse.heatmap.map((views, i) => (
                  <div key={i} style={{ background: `hsl(${views / 10000 * 120}, 100%, 50%)` }}></div>
                ))}
              </div>
            }
          />
          <Card
            title="Engagement Trends"
            ref={engagementTrendRef}
            content={<div dangerouslySetInnerHTML={{ __html: analysisData.engagementTrend.content }} />}
            extra={analysisData.engagementTrend.chartData && (
              <div className="chart-container">
                <Line data={analysisData.engagementTrend.chartData} options={{ responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }} />
              </div>
            )}
          />
          <Card
            title="InfluenceIQ Scorecard"
            ref={scorecardRef}
            content={<div dangerouslySetInnerHTML={{ __html: analysisData.scorecard.content }} />}
            extra={<button className="export-btn" onClick={exportReport}>Export Report</button>}
          />
        </div>
      </div>
    </section>
  );
}

export default Analysis;
