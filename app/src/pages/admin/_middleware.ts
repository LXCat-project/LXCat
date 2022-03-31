import { NextResponse } from 'next/server'


export async function middleware() {
    return NextResponse.next()
    // TODO make `npm run build` not error with
    //   Dynamic Code Evaluation (e. g. 'eval', 'new Function') not allowed in Middleware pages/admin/_middleware`
    // TODO move to auth/middleware as hasAdminRole()
    // const requestForNextAuth = {
    //     headers: {
    //         cookie: req.headers.get('cookie'),
    //     },
    // };
    // const session = await getSession({ req: requestForNextAuth as any })
    // if (!session?.user) {
    //     return new Response('Unauthorized', {
    //         status: 401,
    //         headers: {
    //             'WWW-Authenticate': 'OAuth',
    //         },

    //     })
    // }

    // if (session!.user!.roles!.includes(Role.enum.admin)) {
    //     return NextResponse.next()
    // }

    // return new Response('Forbidden', {
    //     status: 403,
    // })
}
