export const PAGE_SIZE = 10;

export function getPage(req) {
    const page = parseInt(req.query.page, 10);
    return Number.isFinite(page) && page > 0 ? page : 1;
}

export function buildPaginationMeta(total, page) {
    const totalProjects = total || 0;
    const totalPages = Math.max(1, Math.ceil(totalProjects / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    return {
        totalProjects,
        currentPage,
        pageSize: PAGE_SIZE,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
    };
}
