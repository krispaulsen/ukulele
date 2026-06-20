export default function YouTubeEmbed({ videoId }) {
    if (!videoId) return null;

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    // const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return (
        <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
        />
    );
}
